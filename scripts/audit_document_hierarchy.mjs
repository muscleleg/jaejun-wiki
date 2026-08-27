import { readdir, readFile } from "node:fs/promises";
import { dirname, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const articleRoot = resolve(wikiRoot, "wiki");
const manifestPath = resolve(wikiRoot, "knowledge_manifest.json");

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(path);
    return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

function count(content, pattern) {
  return [...content.matchAll(pattern)].length;
}

function localDocumentReferences(content, sourceHref) {
  return [...content.matchAll(/href=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((href) => href && !/^[a-z]+:/i.test(href))
    .map((href) => {
      const [pathAndQuery, rawFragment = ""] = href.split("#", 2);
      const path = pathAndQuery.split("?")[0];
      if (path && !path.endsWith(".html")) return null;
      return {
        href: path ? posix.normalize(posix.join(posix.dirname(sourceHref), path)) : sourceHref,
        fragment: rawFragment ? decodeURIComponent(rawFragment) : "",
      };
    })
    .filter(Boolean);
}

const manifestSource = await readFile(manifestPath, "utf8");
const manifest = JSON.parse(manifestSource);
const files = (await collectHtmlFiles(articleRoot)).sort();
const fileHrefs = files.map((file) => relative(wikiRoot, file).replaceAll("\\", "/"));
const documentByHref = new Map(manifest.documents.map((document) => [document.href, document]));
const contentByHref = new Map(await Promise.all(files.map(async (file, index) => [
  fileHrefs[index],
  await readFile(file, "utf8"),
])));
const idsByHref = new Map([...contentByHref].map(([href, content]) => [
  href,
  new Set([...content.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1])),
]));
const findings = [];

for (const href of fileHrefs) {
  if (!documentByHref.has(href)) findings.push(`${href}: 검색 manifest 누락`);
}
for (const document of manifest.documents) {
  const content = contentByHref.get(document.href);
  if (!content) {
    findings.push(`${document.href}: 실제 HTML 파일 누락`);
    continue;
  }
  const head = content.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || "";
  if (count(head, /<title\b[^>]*>/gi) !== 1) findings.push(`${document.href}: head의 title은 정확히 하나여야 함`);
  if (count(content, /<h1\b[^>]*>/gi) !== 1) findings.push(`${document.href}: h1은 정확히 하나여야 함`);
  if (document.parentHref) {
    if (document.parentHref === document.href) findings.push(`${document.href}: 자기 자신을 부모로 참조`);
    const parent = documentByHref.get(document.parentHref);
    if (!parent) {
      findings.push(`${document.href}: 부모 ${document.parentHref} 누락`);
    } else {
      const parentLinks = localDocumentReferences(contentByHref.get(parent.href), parent.href).map((reference) => reference.href);
      const childLinks = localDocumentReferences(content, document.href).map((reference) => reference.href);
      if (!parentLinks.includes(document.href)) findings.push(`${document.href}: 부모 ${parent.href}에서 정방향 링크 누락`);
      if (!childLinks.includes(parent.href)) findings.push(`${document.href}: 부모 ${parent.href}로 돌아가는 역방향 링크 누락`);
    }
  }
  for (const reference of localDocumentReferences(content, document.href)) {
    if (!reference.fragment || !contentByHref.has(reference.href)) continue;
    if (!idsByHref.get(reference.href).has(reference.fragment)) {
      findings.push(`${document.href}: ${reference.href}#${reference.fragment} fragment 누락`);
    }
  }
}

const siblingKeys = new Map();
for (const document of manifest.documents) {
  const key = `${document.parentHref || "ROOT"}\n${document.title}`;
  const siblings = siblingKeys.get(key) || [];
  siblings.push(document.href);
  siblingKeys.set(key, siblings);
}
for (const [key, siblings] of siblingKeys) {
  if (siblings.length > 1) findings.push(`${key.replace("\n", " / ")}: 같은 계층의 제목 중복 (${siblings.join(", ")})`);
}

let maxDepth = 0;
for (const document of manifest.documents) {
  const seen = new Set();
  let current = document;
  let depth = 0;
  while (current?.parentHref) {
    if (seen.has(current.href)) {
      findings.push(`${document.href}: 부모 계층 cycle`);
      break;
    }
    seen.add(current.href);
    current = documentByHref.get(current.parentHref);
    depth += 1;
  }
  maxDepth = Math.max(maxDepth, depth);
}
if (maxDepth > 3) findings.push(`문서 계층 최대 깊이는 3이어야 함: 현재 ${maxDepth}`);

for (const document of manifest.documents.filter(({ categoryKey }) => ["llm-systems", "external-articles"].includes(categoryKey))) {
  const content = contentByHref.get(document.href);
  if (!/class=["'][^"']*article-understanding/i.test(content) || !/role=["']progressbar["']/i.test(content)) {
    findings.push(`${document.href}: 이해도 meter 누락`);
  }
}

if (findings.length) {
  console.error(`DOCUMENT_STRUCTURE_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  const parented = manifest.documents.filter((document) => document.parentHref).length;
  console.log(`DOCUMENT_STRUCTURE_AUDIT=PASS documents=${manifest.documents.length} parented=${parented} maxDepth=${maxDepth}`);
}
