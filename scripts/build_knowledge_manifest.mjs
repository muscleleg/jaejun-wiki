import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const articleRoot = resolve(wikiRoot, "wiki");
const outputPath = resolve(wikiRoot, "assets/js/knowledge_manifest.js");

const categoryLabels = {
  "coding-test": "코딩 테스트",
  database: "Database",
  "external-articles": "외부 아티클",
  "llm-systems": "LLM 시스템·에이전트",
  "machine-learning": "Machine Learning",
  math: "수학",
  pandas: "Pandas·데이터 전처리",
  projects: "개인 프로젝트",
  pytorch: "PyTorch",
  transformer: "Transformer",
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
    category: categoryLabels[categoryKey] || categoryKey,
    categoryKey,
    isCategoryIndex: file.endsWith("/index.html"),
    parentHref,
  });
}

const manifest = {
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

console.log(`Indexed ${manifest.indexedCount} pages (${manifest.documentCount} documents).`);
