import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const publicBaseUrl = "https://muscleleg.github.io/jaejun-wiki/";
const metadataStart = "  <!-- machine-readable-metadata:start -->";
const metadataEnd = "  <!-- machine-readable-metadata:end -->";

await import(new URL("./build_knowledge_manifest.mjs", import.meta.url));

const knowledgeManifest = JSON.parse(await readFile(resolve(wikiRoot, "knowledge_manifest.json"), "utf8"));
const conceptGraph = JSON.parse(await readFile(resolve(wikiRoot, "concept_graph.json"), "utf8"));
const knowledgeByHref = new Map(knowledgeManifest.documents.map((document) => [document.href, document]));
const conceptLabelByKey = new Map(conceptGraph.concepts.map((concept) => [concept.conceptKey, concept.labels[0] || concept.conceptKey]));

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
  return value
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

function extract(content, pattern) {
  const match = content.match(pattern);
  return match ? decodeEntities(match[1]) : "";
}

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function relativeRootPrefix(href) {
  const depth = href.split("/").length - 1;
  return "../".repeat(depth);
}

function publicUrlForHref(href) {
  return href === "index.html" ? publicBaseUrl : new URL(href, publicBaseUrl).href;
}

function classifyPage(href) {
  if (href === "index.html") return "WebSite";
  if (href.startsWith("wiki/") && !href.endsWith("/index.html")) return "TechArticle";
  if (href.startsWith("roadmaps/") || href === "pytorch_professional_roadmap.html") return "LearningResource";
  return "CollectionPage";
}

function inferParentHref(href, knowledgeDocument) {
  if (knowledgeDocument?.parentHref) return knowledgeDocument.parentHref;
  if (href.endsWith("/index.html") && href.startsWith("wiki/")) return "wiki.html";
  if (href.startsWith("roadmaps/")) return "pytorch_professional_roadmap.html";
  if (["wiki.html", "learning_history.html", "pytorch_professional_roadmap.html"].includes(href)) return "index.html";
  if (href === "knowledge_map.html") return "wiki.html";
  return null;
}

function extractBreadcrumbs(content, href, title) {
  const block = content.match(/<nav[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1] || "";
  const items = [];
  for (const match of block.matchAll(/<(a|span)([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const label = decodeEntities(match[3]);
    if (!label || label === "›") continue;
    const link = match[2].match(/href=["']([^"']+)["']/i)?.[1] || null;
    items.push({
      name: label.replace(/^⌂\s*/, ""),
      href: link ? new URL(link, new URL(href, publicBaseUrl)).href : null,
    });
  }
  if (!items.length) items.push({ name: title, href: publicUrlForHref(href) });
  return items;
}

function buildJsonLd(page) {
  const pageId = `${page.url}#page`;
  const websiteId = `${publicBaseUrl}#website`;
  const pageEntity = {
    "@type": page.documentType,
    "@id": page.documentType === "WebSite" ? websiteId : pageId,
    url: page.url,
    name: page.title,
    description: page.description,
    inLanguage: "ko",
  };

  if (page.documentType !== "WebSite") {
    pageEntity.isPartOf = { "@id": websiteId };
    pageEntity.mainEntityOfPage = { "@id": page.url };
  }
  if (page.documentType === "TechArticle") pageEntity.headline = page.title;
  if (page.documentType === "LearningResource") pageEntity.learningResourceType = "Roadmap";
  if (page.conceptKeys.length) {
    pageEntity.about = page.conceptKeys.map((conceptKey) => ({
      "@type": "Thing",
      "@id": `${publicBaseUrl}concept_graph.json#${conceptKey}`,
      name: conceptLabelByKey.get(conceptKey) || conceptKey,
      identifier: conceptKey,
    }));
  }

  const graph = [pageEntity];
  if (page.documentType !== "WebSite") {
    graph.push({
      "@type": "WebSite",
      "@id": websiteId,
      url: publicBaseUrl,
      name: "공부의 흐름을 기록하는 기술 위키",
      inLanguage: "ko",
    });
  }
  if (page.breadcrumbs.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${page.url}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.href ? { item: item.href } : {}),
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function buildMetadataBlock(page) {
  const rootPrefix = relativeRootPrefix(page.href);
  const jsonLd = JSON.stringify(buildJsonLd(page)).replaceAll("<", "\\u003c");
  const lines = [metadataStart];
  if (!page.hasDescription) lines.push(`  <meta name="description" content="${escapeAttribute(page.description)}">`);
  lines.push(
    `  <link rel="canonical" href="${escapeAttribute(page.url)}">`,
    `  <link rel="alternate" type="application/json" href="${rootPrefix}site_manifest.json" title="사이트 문서 색인">`,
    `  <link rel="alternate" type="application/json" href="${rootPrefix}knowledge_manifest.json" title="기술 위키 문서 색인">`,
    `  <link rel="alternate" type="application/json" href="${rootPrefix}concept_graph.json" title="지식 개념 그래프">`,
    `  <link rel="alternate" type="text/plain" href="${rootPrefix}llms.txt" title="LLM용 사이트 안내">`,
    `  <meta property="og:type" content="${page.documentType === "TechArticle" ? "article" : "website"}">`,
    `  <meta property="og:locale" content="ko_KR">`,
    `  <meta property="og:title" content="${escapeAttribute(page.title)}">`,
    `  <meta property="og:description" content="${escapeAttribute(page.description)}">`,
    `  <meta property="og:url" content="${escapeAttribute(page.url)}">`,
    "  <script type=\"application/ld+json\">",
    `  ${jsonLd}`,
    "  </script>",
    metadataEnd,
  );
  return lines.join("\n");
}

function removeMetadataBlock(content) {
  const existing = new RegExp(`${metadataStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${metadataEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "g");
  return content.replace(existing, "");
}

function replaceMetadataBlock(content, block) {
  const withoutExisting = removeMetadataBlock(content);
  return withoutExisting.replace(/\n?<\/head>/i, `\n${block}\n</head>`);
}

const htmlFiles = (await collectHtmlFiles(wikiRoot)).sort();
const pages = [];

for (const file of htmlFiles) {
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  const content = await readFile(file, "utf8");
  const authoredContent = removeMetadataBlock(content);
  const knowledgeDocument = knowledgeByHref.get(href);
  const title = extract(authoredContent, /<title[^>]*>([\s\S]*?)<\/title>/i)
    || extract(authoredContent, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
    || href;
  const explicitDescription = extract(authoredContent, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const description = explicitDescription
    || extract(authoredContent, /<p[^>]*class=["'][^"']*(?:summary|lead|intro)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)
    || knowledgeDocument?.description
    || title;
  const page = {
    id: href.replace(/\.html$/, "").replaceAll("/", "-"),
    href,
    url: publicUrlForHref(href),
    title,
    description,
    documentType: classifyPage(href),
    language: "ko",
    parentHref: inferParentHref(href, knowledgeDocument),
    breadcrumbs: extractBreadcrumbs(authoredContent, href, title),
    conceptKeys: knowledgeDocument?.conceptKeys || [],
    hasDescription: Boolean(explicitDescription),
  };
  pages.push(page);
  const updated = replaceMetadataBlock(content, buildMetadataBlock(page));
  if (updated !== content) await writeFile(file, updated, "utf8");
}

const siteManifest = {
  schemaVersion: 1,
  site: publicBaseUrl,
  language: "ko",
  pageCount: pages.length,
  resources: {
    sitemap: `${publicBaseUrl}sitemap.xml`,
    llms: `${publicBaseUrl}llms.txt`,
    knowledgeManifest: `${publicBaseUrl}knowledge_manifest.json`,
    conceptGraph: `${publicBaseUrl}concept_graph.json`,
  },
  pages: pages.map(({ hasDescription, ...page }) => page),
};
await writeFile(resolve(wikiRoot, "site_manifest.json"), `${JSON.stringify(siteManifest, null, 2)}\n`, "utf8");

const sitemap = [
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
  "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
  ...pages.map((page) => `  <url><loc>${escapeXml(page.url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");
await writeFile(resolve(wikiRoot, "sitemap.xml"), sitemap, "utf8");

const llmsText = `# 공부의 흐름을 기록하는 기술 위키

> 프로젝트, Machine Learning, PyTorch, Transformer, 수학과 LLM 시스템을 직접 구현하고 검증하며 남긴 한국어 기술 위키입니다.

## 주요 진입점

- [홈](${publicBaseUrl})
- [기술 위키 전체 문서](${publicBaseUrl}wiki.html)
- [지식 지도](${publicBaseUrl}knowledge_map.html)
- [통합 학습 로드맵](${publicBaseUrl}pytorch_professional_roadmap.html)
- [학습 기록](${publicBaseUrl}learning_history.html)

## 기계 판독용 색인

- [전체 사이트 문서 색인](${publicBaseUrl}site_manifest.json): 공개 HTML 페이지의 제목, 설명, 유형, 상위 문서와 breadcrumb
- [기술 위키 문서 색인](${publicBaseUrl}knowledge_manifest.json): 기술 문서의 카테고리, 부모 관계, 검색 텍스트와 conceptKey
- [개념 그래프](${publicBaseUrl}concept_graph.json): 같은 개념의 중복 배치, 관점별 경로와 문서 연결
- [사이트맵](${publicBaseUrl}sitemap.xml): 공개 HTML의 canonical URL 목록

## 읽는 방법

- 개별 문서는 정적 HTML 본문을 기준으로 읽습니다.
- 문서 계층은 기술 위키 색인의 parentHref와 breadcrumbs를 따릅니다.
- 지식 지도에서 같은 conceptKey가 여러 번 나오는 것은 오류가 아니라 서로 다른 관점에서 같은 개념을 찾기 위한 의도적인 중복입니다.
- 학습 완료 여부는 문서 존재가 아니라 로드맵과 검증 기록을 기준으로 해석합니다.
`;
await writeFile(resolve(wikiRoot, "llms.txt"), llmsText, "utf8");

console.log(`MACHINE_READABLE_SITE_BUILD=PASS pages=${pages.length} descriptions=${pages.length} canonical=${pages.length} jsonLd=${pages.length}`);
