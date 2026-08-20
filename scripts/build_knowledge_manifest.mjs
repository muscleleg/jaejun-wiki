import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
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

const files = (await collectHtmlFiles(articleRoot)).sort();
const documents = [];

for (const file of files) {
  const content = await readFile(file, "utf8");
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  const categoryKey = href.split("/")[1];
  const title = extract(content, /<title>([\s\S]*?)<\/title>/i)
    || extract(content, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const description = extract(content, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i)
    || extract(content, /<p[^>]*class=["'][^"']*(?:summary|lead)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);

  documents.push({
    id: href.replace(/\.html$/, "").replaceAll("/", "-"),
    title,
    description,
    href,
    category: categoryLabels[categoryKey] || categoryKey,
    categoryKey,
    isCategoryIndex: file.endsWith("/index.html"),
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
