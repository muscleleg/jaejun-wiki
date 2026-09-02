import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { itemsForPlacement, loadContentCatalog } from "./content_catalog.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const findings = [];

async function source(path) {
  return readFile(resolve(wikiRoot, path), "utf8");
}

function markerContent(html, markerPrefix) {
  const startToken = `<!-- ${markerPrefix}:start -->`;
  const endToken = `<!-- ${markerPrefix}:end -->`;
  const start = html.indexOf(startToken);
  const end = html.indexOf(endToken, start + startToken.length);
  if (start === -1 || end === -1) {
    findings.push(`${markerPrefix}: 정적 렌더링 경계를 찾을 수 없음`);
    return "";
  }
  return html.slice(start + startToken.length, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function placementHref(item, placement = "wiki") {
  return placement === "blog" ? `${item.href}?view=blog` : item.href;
}

function itemLinkBlock(region, item, location, placement = "wiki") {
  const href = placementHref(item, placement);
  const match = region.match(new RegExp(`<a\\b[^>]*href=["']${escapeRegExp(href)}["'][^>]*>[\\s\\S]*?<\\/a>`, "i"));
  if (!match) findings.push(`${location}: ${item.id}의 링크 카드 누락`);
  return match?.[0] || "";
}

function requireItem(region, item, location, placement = "wiki") {
  const block = itemLinkBlock(region, item, location, placement);
  for (const value of [item.href, item.title, item.summary]) {
    if (!block.includes(value) && !block.includes(escapeHtml(value))) findings.push(`${location}: ${item.id}의 ${JSON.stringify(value)} 누락`);
  }
  return block;
}

function requirePublishedDate(region, item, location) {
  const expected = `<time datetime="${item.publishedAt}">${item.publishedAt.replaceAll("-", ".")}</time>`;
  if (!region.includes(expected)) findings.push(`${location}: ${item.id}의 등록일 ${item.publishedAt} 누락`);
}

function hrefOrder(region, items, location, placement = "wiki") {
  let previousIndex = -1;
  for (const item of items) {
    const href = placementHref(item, placement);
    const index = region.indexOf(`href="${href}"`);
    if (index === -1) {
      findings.push(`${location}: ${item.href} 링크 누락`);
    } else if (index <= previousIndex) {
      findings.push(`${location}: 기본 날짜·명시적 고정 순서와 다름 (${item.href})`);
    }
    previousIndex = Math.max(previousIndex, index);
  }
}

const catalog = await loadContentCatalog();
const [homeHtml, projectsHtml, blogHtml, wikiHtml, knowledgeManifestSource, homeContentSource] = await Promise.all([
  source("index.html"),
  source("projects.html"),
  source("blog.html"),
  source("wiki.html"),
  source("knowledge_manifest.json"),
  source("assets/js/home_content.js"),
]);
const knowledgeManifest = JSON.parse(knowledgeManifestSource);
const knowledgeByHref = new Map(knowledgeManifest.documents.map((document) => [document.href, document]));
const catalogItemsWithDates = catalog.items.map((item) => ({ ...item, publishedAt: catalog.documentDates[item.href] }));

try {
  await access(resolve(wikiRoot, "assets/data/blog_selection.json"));
  findings.push("assets/data/blog_selection.json: 메뉴별 중복 메타데이터 원본이 남아 있음");
} catch {
  // 통합 카탈로그만 남아 있는 정상 상태다.
}
if (homeContentSource.includes("featuredProjects")) findings.push("assets/js/home_content.js: 중복 프로젝트 목록이 남아 있음");

for (const item of catalogItemsWithDates) {
  try {
    await access(resolve(wikiRoot, item.href));
  } catch {
    findings.push(`content_catalog.json: ${item.id}의 상세 문서 ${item.href} 누락`);
  }

  if (item.thumbnail) {
    try {
      await access(resolve(wikiRoot, item.thumbnail.src));
    } catch {
      findings.push(`content_catalog.json: ${item.id}의 썸네일 ${item.thumbnail.src} 누락`);
    }
  }

  const indexed = knowledgeByHref.get(item.href);
  if (!indexed) {
    findings.push(`knowledge_manifest.json: ${item.href} 누락`);
  } else {
    if (indexed.title !== item.title) findings.push(`knowledge_manifest.json: ${item.id} 제목이 카탈로그와 다름`);
    if (indexed.description !== item.summary) findings.push(`knowledge_manifest.json: ${item.id} 요약이 카탈로그와 다름`);
    if (indexed.publishedAt !== item.publishedAt) findings.push(`knowledge_manifest.json: ${item.id} 등록일이 카탈로그와 다름`);
  }
}

const manifestHrefs = new Set(knowledgeManifest.documents.map(({ href }) => href));
const datedHrefs = new Set(Object.keys(catalog.documentDates));
for (const document of knowledgeManifest.documents) {
  const publishedAt = catalog.documentDates[document.href];
  if (!publishedAt) findings.push(`content_catalog.json: ${document.href} 작성일 누락`);
  if (document.publishedAt !== publishedAt) findings.push(`knowledge_manifest.json: ${document.href} 작성일 불일치`);
}
for (const href of datedHrefs) {
  if (!manifestHrefs.has(href)) findings.push(`content_catalog.json: 위키 색인에 없는 날짜 항목 ${href}`);
}

const placementAudits = [
  { placement: "home", location: "index.html 프로젝트", region: markerContent(homeHtml, "static-fallback:home-projects"), items: itemsForPlacement(catalog, "projects").slice(0, 5) },
  { placement: "projects", location: "projects.html 프로젝트", region: markerContent(projectsHtml, "static-fallback:projects-page") },
  { placement: "blog", location: "blog.html 글 목록", region: markerContent(blogHtml, "curated-blog:cards") },
];

for (const { placement, location, region, items: explicitItems } of placementAudits) {
  const items = explicitItems || itemsForPlacement(catalog, placement);
  for (const item of items) {
    const block = requireItem(region, item, location, placement);
    if (placement === "blog") requirePublishedDate(block, item, location);
  }
  hrefOrder(region, items, location, placement);
}

for (const item of itemsForPlacement(catalog, "wiki")) {
  const block = requireItem(wikiHtml, item, "wiki.html 문서 계층");
  requirePublishedDate(block, item, "wiki.html 문서 계층");
}

for (const document of knowledgeManifest.documents) {
  const datedDocument = { ...document, publishedAt: catalog.documentDates[document.href] };
  const block = itemLinkBlock(wikiHtml, datedDocument, "wiki.html 전체 문서 날짜");
  requirePublishedDate(block, datedDocument, "wiki.html 전체 문서 날짜");
}

if (findings.length > 0) {
  console.error(`콘텐츠 카탈로그 감사 실패 (${findings.length}건)`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`콘텐츠 카탈로그 감사 통과: ${knowledgeManifest.documents.length}개 위키 문서 날짜와 ${catalog.items.length}개 노출 항목의 상세 링크·메타데이터·정렬·선택형 썸네일을 확인했습니다.`);
