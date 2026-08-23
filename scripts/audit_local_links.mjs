import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const findings = [];
let checked = 0;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.name === ".git") return [];
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return entry.isFile() ? [path] : [];
  }));
  return nested.flat();
}

function targetPathFor(sourceFile, rawPath) {
  const decoded = decodeURIComponent(rawPath || "");
  if (!decoded) return sourceFile;
  if (decoded.startsWith("/jaejun-wiki/")) return resolve(wikiRoot, decoded.slice("/jaejun-wiki/".length));
  if (decoded.startsWith("/")) return resolve(wikiRoot, decoded.slice(1));
  return resolve(dirname(sourceFile), decoded);
}

const files = await collectFiles(wikiRoot);
const htmlFiles = files.filter((file) => file.endsWith(".html"));
const contentByFile = new Map(await Promise.all(htmlFiles.map(async (file) => [file, await readFile(file, "utf8")])))
const idsByFile = new Map([...contentByFile].map(([file, content]) => [
  file,
  new Set([
    ...[...content.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]),
    ...[...content.matchAll(/<a\b[^>]*\bname=["']([^"']+)["']/gi)].map((match) => match[1]),
  ]),
]));

for (const [sourceFile, content] of contentByFile) {
  for (const match of content.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1].trim();
    if (!value || value.includes("${") || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(value)) continue;
    const [pathAndQuery, rawFragment = ""] = value.split("#", 2);
    const rawPath = pathAndQuery.split("?", 1)[0];
    const target = targetPathFor(sourceFile, rawPath);
    checked += 1;
    try {
      const targetStat = await stat(target);
      if (!targetStat.isFile()) {
        findings.push(`${relative(wikiRoot, sourceFile)}: 파일이 아닌 대상 ${value}`);
        continue;
      }
    } catch {
      findings.push(`${relative(wikiRoot, sourceFile)}: 누락된 대상 ${value}`);
      continue;
    }
    if (rawFragment && target.endsWith(".html")) {
      const fragment = decodeURIComponent(rawFragment);
      if (!idsByFile.get(target)?.has(fragment)) findings.push(`${relative(wikiRoot, sourceFile)}: 누락된 fragment ${value}`);
    }
  }
}

if (findings.length) {
  console.error(`LOCAL_LINK_AUDIT=FAIL checked=${checked} findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`LOCAL_LINK_AUDIT=PASS checked=${checked} findings=0`);
}
