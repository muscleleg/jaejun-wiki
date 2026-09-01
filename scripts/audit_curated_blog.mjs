import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { itemsForPlacement, loadContentCatalog } from "./content_catalog.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const findings = [];

const [catalog, manifest, blog, siteManifest, sitemap] = await Promise.all([
  loadContentCatalog(),
  readFile(resolve(wikiRoot, "knowledge_manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(wikiRoot, "blog.html"), "utf8"),
  readFile(resolve(wikiRoot, "site_manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(wikiRoot, "sitemap.xml"), "utf8"),
]);

const posts = itemsForPlacement(catalog, "blog");
const documentByHref = new Map(manifest.documents.map((document) => [document.href, document]));
const tagById = new Map(catalog.tags.map((tag) => [tag.id, tag]));
const blogTagIds = new Set(posts.flatMap((post) => post.tagIds));

for (const item of posts) {
  const document = documentByHref.get(item.href);
  if (!document) {
    findings.push(`knowledge_manifest.json: 블로그 문서 누락 ${item.href}`);
    continue;
  }
  const article = await readFile(resolve(wikiRoot, item.href), "utf8");
  const expectedCanonical = `https://muscleleg.github.io/jaejun-wiki/${item.href}`;
  if (!article.includes(`<link rel="canonical" href="${expectedCanonical}">`)) findings.push(`${item.href}: 위키 canonical 누락`);
  if (!article.includes("curated-blog:document-note:start") || !article.includes("기술 블로그")) findings.push(`${item.href}: 블로그 표식 누락`);
  if (!blog.includes(`href="${item.href}"`)) findings.push(`blog.html: 문서 링크 누락 ${item.href}`);
  if (!blog.includes(`<h3>${item.title}</h3>`) || !blog.includes(`<p>${item.summary}</p>`)) findings.push(`blog.html: 통합 카탈로그 제목·요약 불일치 ${item.href}`);
  if (!blog.includes(document.category)) findings.push(`blog.html: 위키 카테고리 누락 ${item.href}`);
  if (!blog.includes(`data-blog-tags="${item.tagIds.join(" ")}"`)) findings.push(`blog.html: 필터 연결 누락 ${item.href}`);
  for (const tagId of item.tagIds) {
    const tag = tagById.get(tagId);
    if (!blog.includes(`#${tag.label}`)) findings.push(`blog.html: 태그 누락 ${item.href} → ${tag.label}`);
  }
}

for (const tagId of blogTagIds) {
  if (!blog.includes(`data-blog-filter="${tagId}"`)) findings.push(`blog.html: tag 필터 누락 ${tagId}`);
}

const renderedCards = [...blog.matchAll(/class="curated-blog-card"/g)].length;
if (renderedCards !== posts.length) findings.push(`blog.html: 카드 수 ${renderedCards}/${posts.length}`);
if (!blog.includes("curated-blog:cards:start") || !blog.includes("curated-blog:cards:end")) findings.push("blog.html: 정적 생성 영역 표식 누락");
if (!blog.includes('<link rel="canonical" href="https://muscleleg.github.io/jaejun-wiki/blog.html">')) findings.push("blog.html: CollectionPage canonical 누락");
if (!siteManifest.pages.some((page) => page.href === "blog.html")) findings.push("site_manifest.json: blog.html 누락");
if (!sitemap.includes("https://muscleleg.github.io/jaejun-wiki/blog.html")) findings.push("sitemap.xml: blog.html 누락");
if (siteManifest.pages.some((page) => /^blog\/.+\.html$/.test(page.href))) findings.push("site_manifest.json: 별도 블로그 본문 URL이 생성됨");
if (!blog.includes('data-blog-filter="all"') || !blog.includes('id="curatedBlogFilterStatus"')) findings.push("blog.html: 전체 필터 또는 결과 상태 누락");
if (!blog.includes("assets/js/blog.js")) findings.push("blog.html: 태그 필터 JavaScript 누락");

if (findings.length) {
  console.error(`CURATED_BLOG_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`CURATED_BLOG_AUDIT=PASS posts=${posts.length} tags=${blogTagIds.size} canonicalWikiSources=${posts.length}`);
