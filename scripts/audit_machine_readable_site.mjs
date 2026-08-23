import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const publicBaseUrl = "https://muscleleg.github.io/jaejun-wiki/";
const findings = [];

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.name === ".git") return [];
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(path);
    return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

function count(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

function expectedUrl(href) {
  return href === "index.html" ? publicBaseUrl : new URL(href, publicBaseUrl).href;
}

function relativeRootPrefix(href) {
  return "../".repeat(href.split("/").length - 1);
}

const htmlFiles = (await collectHtmlFiles(wikiRoot)).sort();
const expectedByHref = new Map(htmlFiles.map((file) => {
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  return [href, expectedUrl(href)];
}));
const canonicalUrls = new Set();

for (const [href, url] of expectedByHref) {
  const content = await readFile(resolve(wikiRoot, href), "utf8");
  const head = content.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
  if (count(head, /<meta\s+name=["']description["']/gi) !== 1) findings.push(`${href}: description은 정확히 하나여야 함`);
  if (count(head, /<link\s+rel=["']canonical["']/gi) !== 1) findings.push(`${href}: canonical은 정확히 하나여야 함`);
  const canonical = head.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1] || "";
  if (canonical !== url) findings.push(`${href}: canonical 불일치 (${canonical || "누락"})`);
  if (canonicalUrls.has(canonical)) findings.push(`${href}: canonical URL 중복 (${canonical})`);
  canonicalUrls.add(canonical);

  if (count(head, /<meta\s+property=["']og:title["']/gi) !== 1) findings.push(`${href}: og:title은 정확히 하나여야 함`);
  if (count(head, /<meta\s+property=["']og:url["']/gi) !== 1) findings.push(`${href}: og:url은 정확히 하나여야 함`);
  const rootPrefix = relativeRootPrefix(href);
  for (const resource of ["site_manifest.json", "knowledge_manifest.json", "concept_graph.json", "llms.txt"]) {
    if (!head.includes(`href="${rootPrefix}${resource}"`)) findings.push(`${href}: ${resource} 발견 링크 누락`);
  }

  const jsonLdBlocks = [...head.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  if (jsonLdBlocks.length !== 1) {
    findings.push(`${href}: JSON-LD는 정확히 하나여야 함`);
  } else {
    try {
      const parsed = JSON.parse(jsonLdBlocks[0][1]);
      if (parsed["@context"] !== "https://schema.org") findings.push(`${href}: JSON-LD context 불일치`);
    } catch (error) {
      findings.push(`${href}: JSON-LD 파싱 실패 (${error.message})`);
    }
  }
}

for (const filename of ["site_manifest.json", "knowledge_manifest.json", "concept_graph.json"]) {
  try {
    JSON.parse(await readFile(resolve(wikiRoot, filename), "utf8"));
  } catch (error) {
    findings.push(`${filename}: JSON 파싱 실패 (${error.message})`);
  }
}

const siteManifest = JSON.parse(await readFile(resolve(wikiRoot, "site_manifest.json"), "utf8"));
const manifestHrefs = new Set(siteManifest.pages.map((page) => page.href));
const manifestUrls = new Set(siteManifest.pages.map((page) => page.url));
if (siteManifest.pageCount !== expectedByHref.size) findings.push(`site_manifest.json: pageCount ${siteManifest.pageCount} != HTML ${expectedByHref.size}`);
if (manifestUrls.size !== siteManifest.pages.length) findings.push("site_manifest.json: URL 중복");
for (const [key, url] of Object.entries({
  sitemap: `${publicBaseUrl}sitemap.xml`,
  llms: `${publicBaseUrl}llms.txt`,
  knowledgeManifest: `${publicBaseUrl}knowledge_manifest.json`,
  conceptGraph: `${publicBaseUrl}concept_graph.json`,
})) {
  if (siteManifest.resources?.[key] !== url) findings.push(`site_manifest.json: resources.${key} 불일치`);
}
for (const href of expectedByHref.keys()) if (!manifestHrefs.has(href)) findings.push(`site_manifest.json: ${href} 누락`);
for (const href of manifestHrefs) if (!expectedByHref.has(href)) findings.push(`site_manifest.json: 존재하지 않는 ${href} 포함`);
for (const page of siteManifest.pages) {
  if (page.url !== expectedByHref.get(page.href)) findings.push(`site_manifest.json: ${page.href} URL 불일치`);
}

const conceptGraph = JSON.parse(await readFile(resolve(wikiRoot, "concept_graph.json"), "utf8"));
if (!conceptGraph.views.length || !conceptGraph.concepts.length || !conceptGraph.occurrences.length) {
  findings.push("concept_graph.json: 관점·개념·배치 중 하나가 비어 있음");
}
const conceptKeys = new Set(conceptGraph.concepts.map((concept) => concept.conceptKey));
const knowledgeManifest = JSON.parse(await readFile(resolve(wikiRoot, "knowledge_manifest.json"), "utf8"));
for (const document of knowledgeManifest.documents) {
  for (const conceptKey of document.conceptKeys) {
    if (!conceptKeys.has(conceptKey)) findings.push(`knowledge_manifest.json: ${document.href}의 conceptKey ${conceptKey} 누락`);
  }
}

const sitemap = await readFile(resolve(wikiRoot, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapUrlSet = new Set(sitemapUrls);
if (sitemapUrls.length !== sitemapUrlSet.size) findings.push("sitemap.xml: URL 중복");
if (sitemapUrls.length !== expectedByHref.size) findings.push(`sitemap.xml: URL ${sitemapUrls.length} != HTML ${expectedByHref.size}`);
for (const url of expectedByHref.values()) if (!sitemapUrlSet.has(url)) findings.push(`sitemap.xml: ${url} 누락`);

const llms = await readFile(resolve(wikiRoot, "llms.txt"), "utf8");
for (const filename of ["site_manifest.json", "knowledge_manifest.json", "concept_graph.json", "sitemap.xml"]) {
  if (!llms.includes(`${publicBaseUrl}${filename}`)) findings.push(`llms.txt: ${filename} 링크 누락`);
}

if (findings.length) {
  console.error(`MACHINE_READABLE_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`MACHINE_READABLE_AUDIT=PASS pages=${expectedByHref.size} canonical=${canonicalUrls.size} sitemap=${sitemapUrls.length}`);
}
