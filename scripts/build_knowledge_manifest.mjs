import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const articleRoot = resolve(wikiRoot, "wiki");
const outputPath = resolve(wikiRoot, "assets/js/knowledge_manifest.js");
const jsonOutputPath = resolve(wikiRoot, "knowledge_manifest.json");
const conceptOutputPath = resolve(wikiRoot, "concept_graph.json");
const knowledgeMapSourcePath = resolve(wikiRoot, "assets/js/knowledge_map.js");
const publicBaseUrl = "https://muscleleg.github.io/jaejun-wiki/";

const categoryLabels = {
  backend: "Backend·Java",
  "coding-test": "코딩 테스트",
  database: "Database",
  "external-articles": "외부 아티클",
  infrastructure: "Cloud·Infrastructure",
  "llm-systems": "LLM 시스템·에이전트",
  "machine-learning": "Machine Learning",
  math: "수학",
  pandas: "Pandas·데이터 전처리",
  projects: "개인 프로젝트",
  python: "Python",
  pytorch: "PyTorch",
  transformer: "Transformer",
  web: "Web·Frontend",
};

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
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

function extractAll(content, pattern) {
  return [...content.matchAll(pattern)]
    .map((match) => decodeEntities(match[1]))
    .filter(Boolean);
}

function loadKnowledgeMapViews(source) {
  const context = {
    window: {},
    document: { getElementById: () => null },
  };
  runInNewContext(source, context, { filename: "knowledge_map.js" });
  const views = context.window.KNOWLEDGE_MAP_VIEWS || [];
  if (!views.length) throw new Error("knowledge_map.js did not expose KNOWLEDGE_MAP_VIEWS");
  return views;
}

function buildConceptGraph(views) {
  const concepts = new Map();
  const occurrences = [];
  const edges = [];

  function visit(item, view, path, parentOccurrenceId = null) {
    const occurrenceId = `${view.id}:${occurrences.length + 1}`;
    const currentPath = [...path, item.label];
    const href = item.href || null;
    const hrefWithoutFragment = href?.split("#")[0] || null;
    const occurrence = {
      id: occurrenceId,
      conceptKey: item.concept,
      label: item.label,
      viewId: view.id,
      path: currentPath,
      status: item.status || null,
      href,
      url: href ? new URL(href, publicBaseUrl).href : null,
    };
    occurrences.push(occurrence);

    const concept = concepts.get(item.concept) || {
      conceptKey: item.concept,
      labels: new Set(),
      hrefs: new Set(),
      occurrenceIds: [],
    };
    concept.labels.add(item.label);
    if (hrefWithoutFragment) concept.hrefs.add(hrefWithoutFragment);
    concept.occurrenceIds.push(occurrenceId);
    concepts.set(item.concept, concept);

    if (parentOccurrenceId) {
      edges.push({
        source: parentOccurrenceId,
        target: occurrenceId,
        relation: "contains",
        viewId: view.id,
      });
    }
    for (const child of item.children || []) visit(child, view, currentPath, occurrenceId);
  }

  for (const view of views) visit(view.tree, view, []);

  return {
    schemaVersion: 1,
    site: publicBaseUrl,
    views: views.map(({ id, label, description, tree }) => ({
      id,
      label,
      description,
      rootOccurrenceId: occurrences.find((entry) => entry.viewId === id && entry.label === tree.label)?.id || null,
    })),
    concepts: [...concepts.values()].map((concept) => ({
      ...concept,
      labels: [...concept.labels],
      hrefs: [...concept.hrefs],
      urls: [...concept.hrefs].map((href) => new URL(href, publicBaseUrl).href),
    })),
    occurrences,
    edges,
  };
}

const knowledgeMapSource = await readFile(knowledgeMapSourcePath, "utf8");
const conceptGraph = buildConceptGraph(loadKnowledgeMapViews(knowledgeMapSource));
const conceptKeysByHref = new Map();
for (const concept of conceptGraph.concepts) {
  for (const href of concept.hrefs) {
    const keys = conceptKeysByHref.get(href) || new Set();
    keys.add(concept.conceptKey);
    conceptKeysByHref.set(href, keys);
  }
}

const files = (await collectHtmlFiles(articleRoot)).sort();
const documents = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  const categoryKey = href.split("/")[1];
  const headings = extractAll(content, /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi);
  const breadcrumbMatch = content.match(/<nav[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i);
  const breadcrumbContent = breadcrumbMatch?.[1] || "";
  const breadcrumb = decodeEntities(breadcrumbContent);
  const breadcrumbs = extractAll(breadcrumbContent, /<(?:a|span)[^>]*>([\s\S]*?)<\/(?:a|span)>/gi)
    .filter((label) => label !== "›")
    .map((label) => label.replace(/^⌂\s*/, ""));
  const breadcrumbTitle = extractAll(breadcrumbContent, /<span[^>]*>([\s\S]*?)<\/span>/gi)
    .filter((label) => label !== "›")
    .at(-1) || "";
  const title = extract(content, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
    || breadcrumbTitle
    || extract(content, /<h2[^>]*>([\s\S]*?)<\/h2>/i)
    || extract(content, /<title>([\s\S]*?)<\/title>/i);
  const description = extract(content, /<p[^>]*class=["'][^"']*(?:summary|lead|intro)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)
    || extract(content, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || headings.slice(1, 3).join(" · ")
    || headings[0]
    || title;
  const parentLink = content.match(/<a[^>]+href=["']([^"']+\.html(?:#[^"']*)?)["'][^>]*>\s*←[^<]*학습 경로/i);
  const breadcrumbParent = [...breadcrumbContent.matchAll(/<a[^>]+href=["']([^"']+\.html(?:#[^"']*)?)["']/gi)]
    .map((match) => resolve(dirname(file), match[1].split("#")[0]))
    .reverse()
    .find((candidate) => {
      const articleRelative = relative(articleRoot, candidate);
      return candidate !== file
        && articleRelative !== ".."
        && !articleRelative.startsWith("../")
        && !isAbsolute(articleRelative);
    });
  const parentHref = parentLink
    ? relative(wikiRoot, resolve(dirname(file), parentLink[1].split("#")[0])).replaceAll("\\", "/")
    : breadcrumbParent
      ? relative(wikiRoot, breadcrumbParent).replaceAll("\\", "/")
      : null;

  documents.push({
    id: href.replace(/\.html$/, "").replaceAll("/", "-"),
    title,
    description,
    searchText: [breadcrumb, ...headings].filter(Boolean).join(" "),
    href,
    url: new URL(href, publicBaseUrl).href,
    category: categoryLabels[categoryKey] || categoryKey,
    categoryKey,
    isCategoryIndex: file.endsWith("/index.html"),
    parentHref,
    parentId: null,
    documentType: file.endsWith("/index.html") ? "CollectionPage" : "TechArticle",
    language: "ko",
    breadcrumbs,
    conceptKeys: [...(conceptKeysByHref.get(href) || [])],
  });
}

const documentByHref = new Map(documents.map((document) => [document.href, document]));
for (const document of documents) {
  document.parentId = document.parentHref ? documentByHref.get(document.parentHref)?.id || null : null;
}

const manifest = {
  schemaVersion: 1,
  site: publicBaseUrl,
  documentCount: documents.filter((document) => !document.isCategoryIndex).length,
  indexedCount: documents.length,
  categories: Object.entries(categoryLabels).map(([id, label]) => ({ id, label })),
  documents,
};

await writeFile(
  outputPath,
  `window.KNOWLEDGE_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n`,
  "utf8",
);

await writeFile(jsonOutputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
await writeFile(conceptOutputPath, `${JSON.stringify(conceptGraph, null, 2)}\n`, "utf8");

console.log(`Indexed ${manifest.indexedCount} pages (${manifest.documentCount} documents); exported JSON manifest and concept graph.`);
