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

function decodeEntities(value) {
  return String(value || "")
    .replaceAll("&middot;", "·")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function attributeValue(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, "i"))?.[1] || "";
}

function expectedUrl(href) {
  return href === "index.html" ? publicBaseUrl : new URL(href, publicBaseUrl).href;
}

function canonicalizePageUrl(url) {
  const parsed = new URL(url);
  if (`${parsed.origin}${parsed.pathname}` === `${publicBaseUrl}index.html`) {
    return `${publicBaseUrl}${parsed.search}${parsed.hash}`;
  }
  return parsed.href;
}

function relativeRootPrefix(href) {
  return "../".repeat(href.split("/").length - 1);
}

function expectedDocumentType(href) {
  if (href === "index.html") return "WebSite";
  if (href.startsWith("wiki/") && !href.endsWith("/index.html")) return "TechArticle";
  if (href.startsWith("roadmaps/") || ["roadmap.html", "pytorch_professional_roadmap.html", "wiki/coding-test/index.html"].includes(href)) return "LearningResource";
  return "CollectionPage";
}

function extractBreadcrumbs(content, href, title) {
  const block = content.match(/<nav[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1] || "";
  const items = [];
  for (const match of block.matchAll(/<(a|span)([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const name = decodeEntities(match[3]).replace(/^⌂\s*/, "");
    if (!name || name === "›") continue;
    const link = attributeValue(match[2], "href");
    items.push({
      name,
      href: link ? canonicalizePageUrl(new URL(link, new URL(href, publicBaseUrl)).href) : null,
    });
  }
  if (!items.length) items.push({ name: title, href: expectedUrl(href) });
  return items;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sameSet(left, right) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return left.length === right.length
    && leftSet.size === left.length
    && rightSet.size === right.length
    && leftSet.size === rightSet.size
    && [...leftSet].every((value) => rightSet.has(value));
}

const [siteManifest, knowledgeManifest, conceptGraph] = await Promise.all([
  readFile(resolve(wikiRoot, "site_manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(wikiRoot, "knowledge_manifest.json"), "utf8").then(JSON.parse),
  readFile(resolve(wikiRoot, "concept_graph.json"), "utf8").then(JSON.parse),
]);

const htmlFiles = (await collectHtmlFiles(wikiRoot)).sort();
const expectedByHref = new Map(htmlFiles.map((file) => {
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  return [href, expectedUrl(href)];
}));
const expectedUrls = new Set(expectedByHref.values());
const htmlFactsByHref = new Map();
const canonicalUrls = new Set();
const descriptions = new Map();

for (const [href, url] of expectedByHref) {
  const content = await readFile(resolve(wikiRoot, href), "utf8");
  const head = content.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
  const titleTags = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  if (titleTags.length !== 1) findings.push(`${href}: title은 정확히 하나여야 함`);
  const title = decodeEntities(titleTags[0]?.[1] || "");
  if (!title) findings.push(`${href}: title이 비어 있음`);

  const descriptionTags = [...head.matchAll(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/gi)];
  if (descriptionTags.length !== 1) findings.push(`${href}: description은 정확히 하나여야 함`);
  const description = decodeEntities(attributeValue(descriptionTags[0]?.[0] || "", "content"));
  if (!description) findings.push(`${href}: description이 비어 있음`);
  if (description && description === title) findings.push(`${href}: description이 title과 동일함`);
  if (description) {
    const owners = descriptions.get(description) || [];
    owners.push(href);
    descriptions.set(description, owners);
  }

  const canonicalTags = [...head.matchAll(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi)];
  if (canonicalTags.length !== 1) findings.push(`${href}: canonical은 정확히 하나여야 함`);
  const canonical = attributeValue(canonicalTags[0]?.[0] || "", "href");
  if (canonical !== url) findings.push(`${href}: canonical 불일치 (${canonical || "누락"})`);
  if (canonical && canonicalUrls.has(canonical)) findings.push(`${href}: canonical URL 중복 (${canonical})`);
  if (canonical) canonicalUrls.add(canonical);

  const ogValues = {};
  for (const property of ["og:type", "og:title", "og:description", "og:url"]) {
    const tags = [...head.matchAll(new RegExp(`<meta\\b(?=[^>]*\\bproperty=["']${property}["'])[^>]*>`, "gi"))];
    if (tags.length !== 1) findings.push(`${href}: ${property}은 정확히 하나여야 함`);
    ogValues[property] = decodeEntities(attributeValue(tags[0]?.[0] || "", "content"));
  }
  const documentType = expectedDocumentType(href);
  const expectedOgType = documentType === "TechArticle" ? "article" : "website";
  if (ogValues["og:type"] !== expectedOgType) findings.push(`${href}: og:type 불일치`);
  if (ogValues["og:title"] !== title) findings.push(`${href}: og:title과 title 불일치`);
  if (ogValues["og:description"] !== description) findings.push(`${href}: og:description과 description 불일치`);
  if (ogValues["og:url"] !== url) findings.push(`${href}: og:url 불일치`);

  const rootPrefix = relativeRootPrefix(href);
  for (const resource of ["site_manifest.json", "knowledge_manifest.json", "concept_graph.json", "llms.txt"]) {
    if (!head.includes(`href="${rootPrefix}${resource}"`)) findings.push(`${href}: ${resource} 발견 링크 누락`);
  }

  const breadcrumbs = extractBreadcrumbs(content, href, title);
  for (const breadcrumb of breadcrumbs) {
    if (!breadcrumb.href) continue;
    const breadcrumbPageUrl = breadcrumb.href.split("#")[0];
    if (!expectedUrls.has(breadcrumbPageUrl)) {
      findings.push(`${href}: breadcrumb URL이 canonical/sitemap 집합에 없음 (${breadcrumb.href})`);
    }
  }

  const jsonLdBlocks = [...head.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  let jsonLd = null;
  if (jsonLdBlocks.length !== 1) {
    findings.push(`${href}: JSON-LD는 정확히 하나여야 함`);
  } else {
    try {
      jsonLd = JSON.parse(jsonLdBlocks[0][1]);
      if (jsonLd["@context"] !== "https://schema.org") findings.push(`${href}: JSON-LD context 불일치`);
      const entities = Array.isArray(jsonLd["@graph"]) ? jsonLd["@graph"] : [];
      const pageEntity = entities.find((entity) => entity.url === url && entity["@type"] === documentType);
      if (!pageEntity) {
        findings.push(`${href}: JSON-LD 주 페이지 엔티티 누락 또는 type/url 불일치`);
      } else {
        if (pageEntity.name !== title) findings.push(`${href}: JSON-LD name과 title 불일치`);
        if (pageEntity.description !== description) findings.push(`${href}: JSON-LD description 불일치`);
        if (pageEntity.inLanguage !== "ko") findings.push(`${href}: JSON-LD inLanguage 불일치`);
        if (documentType === "TechArticle" && pageEntity.headline !== title) findings.push(`${href}: JSON-LD headline 불일치`);
      }
      const breadcrumbEntity = entities.find((entity) => entity["@type"] === "BreadcrumbList");
      if (breadcrumbs.length > 1) {
        if (!breadcrumbEntity) {
          findings.push(`${href}: JSON-LD BreadcrumbList 누락`);
        } else {
          const jsonLdBreadcrumbs = (breadcrumbEntity.itemListElement || []).map((item) => ({ name: item.name, href: item.item || null }));
          if (!sameJson(jsonLdBreadcrumbs, breadcrumbs)) findings.push(`${href}: JSON-LD breadcrumb와 HTML breadcrumb 불일치`);
        }
      }
    } catch (error) {
      findings.push(`${href}: JSON-LD 파싱 실패 (${error.message})`);
    }
  }

  htmlFactsByHref.set(href, { title, description, url, documentType, breadcrumbs, jsonLd, content });
}

for (const [description, owners] of descriptions) {
  if (owners.length > 1) findings.push(`description 중복 (${owners.length}개): ${owners.join(", ")}`);
}

const manifestHrefs = siteManifest.pages.map((page) => page.href);
const manifestHrefSet = new Set(manifestHrefs);
const manifestUrls = siteManifest.pages.map((page) => page.url);
if (manifestHrefSet.size !== manifestHrefs.length) findings.push("site_manifest.json: href 중복");
if (new Set(manifestUrls).size !== manifestUrls.length) findings.push("site_manifest.json: URL 중복");
if (siteManifest.pageCount !== expectedByHref.size || siteManifest.pages.length !== expectedByHref.size) {
  findings.push(`site_manifest.json: pageCount/pages ${siteManifest.pageCount}/${siteManifest.pages.length} != HTML ${expectedByHref.size}`);
}
for (const [key, url] of Object.entries({
  sitemap: `${publicBaseUrl}sitemap.xml`,
  llms: `${publicBaseUrl}llms.txt`,
  knowledgeManifest: `${publicBaseUrl}knowledge_manifest.json`,
  conceptGraph: `${publicBaseUrl}concept_graph.json`,
})) {
  if (siteManifest.resources?.[key] !== url) findings.push(`site_manifest.json: resources.${key} 불일치`);
}
for (const href of expectedByHref.keys()) if (!manifestHrefSet.has(href)) findings.push(`site_manifest.json: ${href} 누락`);
for (const href of manifestHrefSet) if (!expectedByHref.has(href)) findings.push(`site_manifest.json: 존재하지 않는 ${href} 포함`);

const pageByHref = new Map(siteManifest.pages.map((page) => [page.href, page]));
for (const page of siteManifest.pages) {
  const facts = htmlFactsByHref.get(page.href);
  if (!facts) continue;
  for (const key of ["title", "description", "url", "documentType"]) {
    if (page[key] !== facts[key]) findings.push(`site_manifest.json: ${page.href} ${key}와 HTML 불일치`);
  }
  if (page.language !== "ko") findings.push(`site_manifest.json: ${page.href} language 불일치`);
  if (!sameJson(page.breadcrumbs || [], facts.breadcrumbs)) findings.push(`site_manifest.json: ${page.href} breadcrumb와 HTML 불일치`);
  if (page.parentHref && !pageByHref.has(page.parentHref)) findings.push(`site_manifest.json: ${page.href}의 부모 ${page.parentHref} 누락`);
}
for (const page of siteManifest.pages) {
  const seen = new Set();
  let current = page;
  while (current?.parentHref) {
    if (seen.has(current.href)) {
      findings.push(`site_manifest.json: ${page.href} 부모 cycle`);
      break;
    }
    seen.add(current.href);
    current = pageByHref.get(current.parentHref);
  }
}

const documentHrefs = knowledgeManifest.documents.map((document) => document.href);
const documentHrefSet = new Set(documentHrefs);
const expectedWikiHrefs = [...expectedByHref.keys()].filter((href) => href.startsWith("wiki/"));
if (documentHrefSet.size !== documentHrefs.length) findings.push("knowledge_manifest.json: href 중복");
if (!sameSet(documentHrefs, expectedWikiHrefs)) findings.push("knowledge_manifest.json: wiki HTML 집합과 불일치");
if (knowledgeManifest.indexedCount !== knowledgeManifest.documents.length) findings.push("knowledge_manifest.json: indexedCount 불일치");
if (knowledgeManifest.documentCount !== knowledgeManifest.documents.filter((document) => !document.isCategoryIndex).length) {
  findings.push("knowledge_manifest.json: documentCount 불일치");
}
const documentByHref = new Map(knowledgeManifest.documents.map((document) => [document.href, document]));
for (const document of knowledgeManifest.documents) {
  if (document.parentHref && !documentByHref.has(document.parentHref)) {
    findings.push(`knowledge_manifest.json: ${document.href}의 부모 ${document.parentHref} 누락`);
  }
  if (document.parentHref && document.parentId !== documentByHref.get(document.parentHref)?.id) {
    findings.push(`knowledge_manifest.json: ${document.href} parentId 불일치`);
  }
  const seen = new Set();
  let current = document;
  while (current?.parentHref) {
    if (seen.has(current.href)) {
      findings.push(`knowledge_manifest.json: ${document.href} 부모 cycle`);
      break;
    }
    seen.add(current.href);
    current = documentByHref.get(current.parentHref);
  }
}

const viewsById = new Map();
for (const view of conceptGraph.views || []) {
  if (viewsById.has(view.id)) findings.push(`concept_graph.json: view id 중복 (${view.id})`);
  viewsById.set(view.id, view);
}
const conceptsByKey = new Map();
for (const concept of conceptGraph.concepts || []) {
  if (conceptsByKey.has(concept.conceptKey)) findings.push(`concept_graph.json: conceptKey 중복 (${concept.conceptKey})`);
  conceptsByKey.set(concept.conceptKey, concept);
}
const occurrencesById = new Map();
for (const occurrence of conceptGraph.occurrences || []) {
  if (occurrencesById.has(occurrence.id)) findings.push(`concept_graph.json: occurrence id 중복 (${occurrence.id})`);
  occurrencesById.set(occurrence.id, occurrence);
  if (!viewsById.has(occurrence.viewId)) findings.push(`concept_graph.json: ${occurrence.id}의 view ${occurrence.viewId} 누락`);
  if (!conceptsByKey.has(occurrence.conceptKey)) findings.push(`concept_graph.json: ${occurrence.id}의 conceptKey ${occurrence.conceptKey} 누락`);
  if (occurrence.href) {
    const [targetHref, fragment = ""] = occurrence.href.split("#", 2);
    const facts = htmlFactsByHref.get(targetHref);
    if (!facts) {
      findings.push(`concept_graph.json: ${occurrence.id}의 문서 ${targetHref} 누락`);
    } else if (fragment) {
      const escapedFragment = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`\\bid=["']${escapedFragment}["']`, "i").test(facts.content)) {
        findings.push(`concept_graph.json: ${occurrence.id}의 fragment ${occurrence.href} 누락`);
      }
    }
    const expectedOccurrenceUrl = new URL(occurrence.href, publicBaseUrl).href;
    if (occurrence.url !== expectedOccurrenceUrl) findings.push(`concept_graph.json: ${occurrence.id} URL 불일치`);
  } else if (occurrence.url !== null) {
    findings.push(`concept_graph.json: ${occurrence.id}는 href 없이 URL을 가짐`);
  }
}

const parentsByOccurrence = new Map();
const childrenByOccurrence = new Map();
const edgeKeys = new Set();
for (const edge of conceptGraph.edges || []) {
  const edgeKey = `${edge.viewId}\n${edge.source}\n${edge.target}\n${edge.relation}`;
  if (edgeKeys.has(edgeKey)) findings.push(`concept_graph.json: edge 중복 (${edge.source} → ${edge.target})`);
  edgeKeys.add(edgeKey);
  const source = occurrencesById.get(edge.source);
  const target = occurrencesById.get(edge.target);
  if (!source || !target) {
    findings.push(`concept_graph.json: edge endpoint 누락 (${edge.source} → ${edge.target})`);
    continue;
  }
  if (!viewsById.has(edge.viewId) || source.viewId !== edge.viewId || target.viewId !== edge.viewId) {
    findings.push(`concept_graph.json: edge view 불일치 (${edge.source} → ${edge.target})`);
  }
  const parents = parentsByOccurrence.get(edge.target) || [];
  parents.push(edge.source);
  parentsByOccurrence.set(edge.target, parents);
  const children = childrenByOccurrence.get(edge.source) || [];
  children.push(edge.target);
  childrenByOccurrence.set(edge.source, children);
}

for (const view of conceptGraph.views || []) {
  const root = occurrencesById.get(view.rootOccurrenceId);
  if (!root || root.viewId !== view.id) {
    findings.push(`concept_graph.json: ${view.id} rootOccurrenceId 불일치`);
    continue;
  }
  const viewOccurrenceIds = new Set((conceptGraph.occurrences || []).filter((item) => item.viewId === view.id).map((item) => item.id));
  if ((parentsByOccurrence.get(root.id) || []).length) findings.push(`concept_graph.json: ${view.id} root에 parent 존재`);
  for (const occurrenceId of viewOccurrenceIds) {
    if (occurrenceId === root.id) continue;
    const parentCount = (parentsByOccurrence.get(occurrenceId) || []).length;
    if (parentCount !== 1) findings.push(`concept_graph.json: ${occurrenceId} parent 수 ${parentCount}`);
  }
  const visited = new Set();
  const active = new Set();
  function visit(occurrenceId) {
    if (active.has(occurrenceId)) {
      findings.push(`concept_graph.json: ${view.id} cycle (${occurrenceId})`);
      return;
    }
    if (visited.has(occurrenceId)) return;
    active.add(occurrenceId);
    visited.add(occurrenceId);
    for (const childId of childrenByOccurrence.get(occurrenceId) || []) visit(childId);
    active.delete(occurrenceId);
  }
  visit(root.id);
  for (const occurrenceId of viewOccurrenceIds) {
    if (!visited.has(occurrenceId)) findings.push(`concept_graph.json: ${view.id}에서 ${occurrenceId} 도달 불가`);
  }
}

const actualOccurrenceIdsByConcept = new Map();
const actualHrefsByConcept = new Map();
for (const occurrence of conceptGraph.occurrences || []) {
  const occurrenceIds = actualOccurrenceIdsByConcept.get(occurrence.conceptKey) || [];
  occurrenceIds.push(occurrence.id);
  actualOccurrenceIdsByConcept.set(occurrence.conceptKey, occurrenceIds);
  if (occurrence.href) {
    const hrefs = actualHrefsByConcept.get(occurrence.conceptKey) || [];
    const href = occurrence.href.split("#")[0];
    if (!hrefs.includes(href)) hrefs.push(href);
    actualHrefsByConcept.set(occurrence.conceptKey, hrefs);
  }
}
for (const concept of conceptGraph.concepts || []) {
  const actualOccurrenceIds = actualOccurrenceIdsByConcept.get(concept.conceptKey) || [];
  if (!sameSet(concept.occurrenceIds || [], actualOccurrenceIds)) {
    findings.push(`concept_graph.json: ${concept.conceptKey} occurrenceIds 역참조 불일치`);
  }
  const actualHrefs = actualHrefsByConcept.get(concept.conceptKey) || [];
  if (!sameSet(concept.hrefs || [], actualHrefs)) findings.push(`concept_graph.json: ${concept.conceptKey} hrefs 역참조 불일치`);
  const expectedConceptUrls = (concept.hrefs || []).map((href) => new URL(href, publicBaseUrl).href);
  if (!sameSet(concept.urls || [], expectedConceptUrls)) findings.push(`concept_graph.json: ${concept.conceptKey} urls 불일치`);
}
for (const document of knowledgeManifest.documents) {
  const expectedConceptKeys = [...actualHrefsByConcept]
    .filter(([, hrefs]) => hrefs.includes(document.href))
    .map(([conceptKey]) => conceptKey);
  if (!sameSet(document.conceptKeys || [], expectedConceptKeys)) {
    findings.push(`knowledge_manifest.json: ${document.href} conceptKeys 역참조 불일치`);
  }
}

const sitemap = await readFile(resolve(wikiRoot, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const sitemapUrlSet = new Set(sitemapUrls);
if (sitemapUrls.length !== sitemapUrlSet.size) findings.push("sitemap.xml: URL 중복");
if (sitemapUrls.length !== expectedByHref.size) findings.push(`sitemap.xml: URL ${sitemapUrls.length} != HTML ${expectedByHref.size}`);
for (const url of expectedByHref.values()) if (!sitemapUrlSet.has(url)) findings.push(`sitemap.xml: ${url} 누락`);
for (const url of sitemapUrlSet) if (!expectedUrls.has(url)) findings.push(`sitemap.xml: 존재하지 않는 ${url} 포함`);

const llms = await readFile(resolve(wikiRoot, "llms.txt"), "utf8");
for (const filename of ["site_manifest.json", "knowledge_manifest.json", "concept_graph.json", "sitemap.xml"]) {
  if (!llms.includes(`${publicBaseUrl}${filename}`)) findings.push(`llms.txt: ${filename} 링크 누락`);
}

if (findings.length) {
  console.error(`MACHINE_READABLE_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`MACHINE_READABLE_AUDIT=PASS pages=${expectedByHref.size} canonical=${canonicalUrls.size} sitemap=${sitemapUrls.length} concepts=${conceptGraph.concepts.length} occurrences=${conceptGraph.occurrences.length}`);
}
