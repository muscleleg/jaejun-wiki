import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { itemsForPlacement, loadContentCatalog } from "./content_catalog.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const findings = [];

const [catalog, projects, home, wiki, navigation, siteManifest, sitemap] = await Promise.all([
  loadContentCatalog(),
  readFile(resolve(wikiRoot, "projects.html"), "utf8"),
  readFile(resolve(wikiRoot, "index.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki.html"), "utf8"),
  readFile(resolve(wikiRoot, "assets/js/global_nav.js"), "utf8"),
  readFile(resolve(wikiRoot, "site_manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(wikiRoot, "sitemap.xml"), "utf8"),
]);

const expectedProjects = itemsForPlacement(catalog, "projects");
const renderedCount = (projects.match(/class="card home-project-card"/g) || []).length;
if (renderedCount !== expectedProjects.length) findings.push(`projects.html: 카드 수 ${renderedCount}/${expectedProjects.length}`);
if (!projects.includes('class="projects-list" id="featuredProjectGrid"')) findings.push("projects.html: 세로 프로젝트 목록 누락");
for (const token of ["home-project-rail-navigation", "projectRailPrevious", "projectRailNext", "home-project-rail-status", "assets/js/home_projects.js"]) {
  if (projects.includes(token)) findings.push(`projects.html: 가로 레일 요소가 남아 있음 ${token}`);
}

for (const project of expectedProjects) {
  if (!projects.includes(`href="${project.href}"`)) findings.push(`projects.html: 프로젝트 링크 누락 ${project.href}`);
  if (!projects.includes(`<h3>${project.title}</h3>`)) findings.push(`projects.html: 프로젝트 제목 누락 ${project.title}`);
}

const expectedNavigationOrder = ["⌂ 홈", "프로젝트", "블로그", "위키", "로드맵", "기록"];
let previousIndex = -1;
for (const label of expectedNavigationOrder) {
  const index = navigation.indexOf(`"${label}"`);
  if (index < 0) findings.push(`global_nav.js: 메뉴 누락 ${label}`);
  if (index <= previousIndex) findings.push(`global_nav.js: 메뉴 순서 오류 ${label}`);
  previousIndex = index;
}
if (navigation.includes('["knowledge_map.html", "지도"')) findings.push("global_nav.js: 지도가 전역 메뉴에 남아 있음");
if (!wiki.includes('<a class="wiki-map-button" href="knowledge_map.html">관계로 찾기 →</a>')) findings.push("wiki.html: 관계로 찾기 링크 누락");
if (!home.includes('href="projects.html">개인 프로젝트 전체 보기 →</a>')) findings.push("index.html: 프로젝트 화면 링크 누락");
if (!siteManifest.pages.some((page) => page.href === "projects.html")) findings.push("site_manifest.json: projects.html 누락");
if (!sitemap.includes("https://muscleleg.github.io/jaejun-wiki/projects.html")) findings.push("sitemap.xml: projects.html 누락");

if (findings.length) {
  console.error(`PROJECTS_PAGE_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`PROJECTS_PAGE_AUDIT=PASS projects=${expectedProjects.length} navigation=${expectedNavigationOrder.join("→")}`);
