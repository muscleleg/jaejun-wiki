import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const projectName = "개인화 학습 코치 위키";
const projectHref = "wiki/projects/adaptive-learning-coach.html";
const projectConceptKey = "adaptive-learning-coach-project";
const imageRoot = "assets/images/projects/adaptive-learning-coach";
const findings = [];

async function source(path) {
  return readFile(resolve(wikiRoot, path), "utf8");
}

function requireText(content, expected, location) {
  if (!content.includes(expected)) findings.push(`${location}: ${JSON.stringify(expected)} 누락`);
}

function rejectText(content, forbidden, location) {
  if (content.includes(forbidden)) findings.push(`${location}: 이전 공개 표기 ${JSON.stringify(forbidden)} 잔존`);
}

async function requireAsset(path) {
  try {
    const result = await stat(resolve(wikiRoot, path));
    if (!result.isFile() || result.size === 0) findings.push(`${path}: 비어 있거나 파일이 아님`);
  } catch {
    findings.push(`${path}: 시각 자산 누락`);
  }
}

const [
  homeSource,
  mapSource,
  projectSource,
  wikiSource,
  homeHtml,
  mapHtml,
  siteManifestSource,
  knowledgeManifestSource,
  conceptGraphSource,
  sitemapSource,
  featuredSvg,
  loopSvg,
] = await Promise.all([
  source("assets/js/home_content.js"),
  source("assets/js/knowledge_map.js"),
  source(projectHref),
  source("wiki.html"),
  source("index.html"),
  source("knowledge_map.html"),
  source("site_manifest.json"),
  source("knowledge_manifest.json"),
  source("concept_graph.json"),
  source("sitemap.xml"),
  source(`${imageRoot}/personal-learning-loop-featured.svg`),
  source(`${imageRoot}/personal-learning-loop.svg`),
]);

for (const [location, content] of [
  ["home_content.js", homeSource],
  ["knowledge_map.js", mapSource],
  [projectHref, projectSource],
  ["wiki.html", wikiSource],
  ["index.html", homeHtml],
  ["knowledge_map.html", mapHtml],
]) {
  requireText(content, projectName, location);
  requireText(content, projectHref, location);
}

for (const token of ["백로그", "검증된 학습 상태", "다음 행동"]) {
  requireText(homeSource, token, "assets/js/home_content.js 프로젝트 카드");
}
for (const anchor of [
  "problem",
  "learning-loop",
  "learning-memory",
  "learning-backlog",
  "adaptive-coaching",
  "ownership",
  "document-discovery",
  "knowledge-map",
  "static-build",
  "validation",
  "status-limits",
]) {
  requireText(projectSource, `id="${anchor}"`, `${projectHref} 필수 기능 구간`);
}
for (const token of ["사용자가 주도한 것", "AI를 활용한 것", "현재 상태와 한계"]) {
  requireText(projectSource, token, `${projectHref} 역할·한계`);
}
for (const token of [projectConceptKey, "검증된 학습 기억", "학습 백로그·재등장", "상태 기반 코칭"]) {
  requireText(mapSource, token, "assets/js/knowledge_map.js 프로젝트 관점");
}

const siteManifest = JSON.parse(siteManifestSource);
const knowledgeManifest = JSON.parse(knowledgeManifestSource);
const conceptGraph = JSON.parse(conceptGraphSource);
const sitePages = siteManifest.pages.filter(({ href }) => href === projectHref);
const knowledgeDocuments = knowledgeManifest.documents.filter(({ href }) => href === projectHref);
const projectConcepts = conceptGraph.concepts.filter(({ conceptKey }) => conceptKey === projectConceptKey);
if (sitePages.length !== 1 || sitePages[0].title !== projectName) {
  findings.push(`site_manifest.json: 프로젝트 문서가 이름과 경로에 맞게 정확히 한 번 있어야 함`);
}
if (knowledgeDocuments.length !== 1 || knowledgeDocuments[0].title !== projectName) {
  findings.push(`knowledge_manifest.json: 프로젝트 문서가 이름과 경로에 맞게 정확히 한 번 있어야 함`);
}
if (projectConcepts.length !== 1 || !projectConcepts[0].labels.includes(projectName) || !projectConcepts[0].hrefs.includes(projectHref)) {
  findings.push(`concept_graph.json: 프로젝트 concept key·이름·문서 연결 불일치`);
}
requireText(sitemapSource, `/jaejun-wiki/${projectHref}`, "sitemap.xml");

for (const [location, content] of [
  ["프로젝트 공개 원본", `${homeSource}\n${mapSource}\n${projectSource}\n${wikiSource}\n${homeHtml}\n${mapHtml}\n${siteManifestSource}\n${knowledgeManifestSource}\n${conceptGraphSource}\n${sitemapSource}`],
  ["대표 SVG", `${featuredSvg}\n${loopSvg}`],
]) {
  for (const forbidden of [
    "Learning Loop",
    "Adaptive Learning Coach",
    "wiki/projects/learning-loop",
    "assets/images/projects/learning-loop",
    "wiki/projects/jaejun-wiki",
    "assets/images/projects/jaejun-wiki",
  ]) rejectText(content, forbidden, location);
}
requireText(featuredSvg, projectName, `${imageRoot}/personal-learning-loop-featured.svg`);
requireText(loopSvg, projectName, `${imageRoot}/personal-learning-loop.svg`);

await Promise.all([
  requireAsset(`${imageRoot}/personal-learning-loop-featured.svg`),
  requireAsset(`${imageRoot}/personal-learning-loop.svg`),
  requireAsset(`${imageRoot}/home-projects.webp`),
  requireAsset(`${imageRoot}/wiki-projects.webp`),
  requireAsset(`${imageRoot}/knowledge-map-project.webp`),
]);

if (findings.length) {
  console.error(`PERSONAL_LEARNING_COACH_PROJECT_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`PERSONAL_LEARNING_COACH_PROJECT_AUDIT=PASS name=${projectName} assets=5 sections=11`);
}
