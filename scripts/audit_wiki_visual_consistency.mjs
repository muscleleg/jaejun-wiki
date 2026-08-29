import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const articleRoot = resolve(wikiRoot, "wiki");

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectHtmlFiles(path);
    return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

const files = (await collectHtmlFiles(articleRoot)).sort();
const findings = [];
const counts = { reference: 0, notion: 0, custom: 0, tocEligible: 0, short: 0 };

for (const file of files) {
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  const content = await readFile(file, "utf8");
  const bodyClass = content.match(/<body\b[^>]*class=["']([^"']*)["']/i)?.[1] || "";
  const headingCount = [...content.matchAll(/<h[23](?:\s|>)/gi)].length;

  if (!/assets\/css\/site-theme\.css(?:\?[^"']*)?["']/i.test(content)) {
    findings.push(`${href}: 공통 site-theme.css 누락`);
  }
  if (!/assets\/js\/global_nav\.js\?v=20260829-toc-height-1["']/i.test(content)) {
    findings.push(`${href}: 공통 내비게이션·목차 cache-bust 버전 불일치`);
  }

  if (bodyClass.includes("wiki-reference")) counts.reference += 1;
  else if (bodyClass.includes("notion-import-page")) {
    counts.notion += 1;
    if (!/<main\b[^>]*class=["'][^"']*page-shell/i.test(content)) {
      findings.push(`${href}: Notion 문서 page-shell 누락`);
    }
    if (!/assets\/css\/notion-import\.css(?:\?[^"']*)?["']/i.test(content)) {
      findings.push(`${href}: Notion 공통 스타일 누락`);
    }
  } else if (bodyClass.includes("openstack-project-detail")) counts.custom += 1;
  else findings.push(`${href}: 허용되지 않은 위키 body 레이아웃 (${bodyClass || "class 없음"})`);

  if (headingCount >= 2) counts.tocEligible += 1;
  else counts.short += 1;
}

const theme = await readFile(resolve(wikiRoot, "assets/css/site-theme.css"), "utf8");
const notion = await readFile(resolve(wikiRoot, "assets/css/notion-import.css"), "utf8");
const tocCss = await readFile(resolve(wikiRoot, "assets/css/article-toc.css"), "utf8");
const tocJs = await readFile(resolve(wikiRoot, "assets/js/article_toc.js"), "utf8");
const globalNavJs = await readFile(resolve(wikiRoot, "assets/js/global_nav.js"), "utf8");

if (!/pre\s*\{[\s\S]*?padding:\s*18px 20px\s*!important/i.test(theme)) {
  findings.push("site-theme.css: 데스크톱 코드 블록 공통 padding 누락");
}
if (!/body\s*\{[\s\S]*?background:\s*var\(--paper\)\s*!important/i.test(theme)) {
  findings.push("site-theme.css: 공통 단색 페이지 배경 누락");
}
if (!/\.notion-import-page \.page-shell\s*\{[\s\S]*?width:\s*min\(1120px/i.test(notion)) {
  findings.push("notion-import.css: page-shell 공통 폭 누락");
}
if (!/grid-template-columns:\s*230px minmax\(0, 1fr\)/i.test(tocCss)) {
  findings.push("article-toc.css: 데스크톱 왼쪽 목차 열 누락");
}
const directTocGridRule = tocCss.match(/\.document-toc-layout\s*>\s*\.document-toc\s*\{([^}]*)\}/i)?.[1] || "";
if (!/grid-row:\s*3\s*;/i.test(directTocGridRule)) {
  findings.push("article-toc.css: 목차가 본문 첫 행과 나란히 배치되지 않음");
}
if (/grid-row:[^;]*span\s+\d+/i.test(directTocGridRule)) {
  findings.push("article-toc.css: 목차의 과도한 grid span이 빈 스크롤을 생성할 수 있음");
}
if (!/article-toc\.css\?v=20260829-toc-height-1/i.test(globalNavJs)) {
  findings.push("global_nav.js: 목차 높이 수정 CSS cache-bust 버전 누락");
}
if (!/@media \(max-width:\s*820px\)[\s\S]*?\.document-toc-layout\s*\{[\s\S]*?display:\s*block\s*!important/i.test(tocCss)) {
  findings.push("article-toc.css: 모바일 단일 열 전환 누락");
}
if (!/headings\.length < 2/.test(tocJs) || !/document-toc-layout/.test(tocJs)) {
  findings.push("article_toc.js: 긴 문서 자동 목차 기준 누락");
}

if (findings.length) {
  console.error(`위키 시각 일관성 감사 실패 (${findings.length}건)`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`위키 시각 일관성 감사 통과: ${files.length}개 HTML`);
console.log(`- 공통 참조 레이아웃 ${counts.reference}개`);
console.log(`- Notion 편입 레이아웃 ${counts.notion}개`);
console.log(`- OpenStack 전용 레이아웃 ${counts.custom}개`);
console.log(`- 목차 대상 ${counts.tocEligible}개 / 단일 구간 문서 ${counts.short}개`);
