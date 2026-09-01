import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { itemsForPlacement, loadContentCatalog } from "./content_catalog.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const manifestPath = resolve(wikiRoot, "knowledge_manifest.json");
const blogPath = resolve(wikiRoot, "blog.html");
const cardsStart = "<!-- curated-blog:cards:start -->";
const cardsEnd = "<!-- curated-blog:cards:end -->";
const noteStart = "<!-- curated-blog:document-note:start -->";
const noteEnd = "<!-- curated-blog:document-note:end -->";
const styleMarker = "<!-- curated-blog:document-style -->";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function replaceRegion(content, start, end, markup) {
  if (!content.includes(start) || !content.includes(end)) {
    throw new Error(`Generated region is missing: ${start}`);
  }
  const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  return content.replace(pattern, `${start}\n${markup}\n${end}`);
}

function renderBlog(tags, posts, documentsByHref) {
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const filterButtons = [
    '<button class="curated-blog-filter is-active" type="button" data-blog-filter="all" aria-pressed="true">전체</button>',
    ...tags.map((tag) => `<button class="curated-blog-filter" type="button" data-blog-filter="${escapeHtml(tag.id)}" aria-pressed="false">#${escapeHtml(tag.label)}</button>`),
  ].join("\n          ");
  const cards = posts.map((post) => {
      const document = documentsByHref.get(post.href);
      if (!document) throw new Error(`Blog post href is absent from knowledge_manifest.json: ${post.href}`);
      const displayDate = post.publishedAt.replaceAll("-", ".");
      const tagMarkup = post.tagIds.map((tagId) => `<span class="curated-blog-tag">#${escapeHtml(tagsById.get(tagId).label)}</span>`).join("");
      return `        <a class="curated-blog-card" href="${escapeHtml(document.href)}" data-blog-tags="${escapeHtml(post.tagIds.join(" "))}">
          <span class="curated-blog-card-meta"><span>${escapeHtml(document.category)}</span><time datetime="${escapeHtml(post.publishedAt)}">${escapeHtml(displayDate)}</time></span>
          <h3>${escapeHtml(post.title)}</h3>
          <p>${escapeHtml(post.summary)}</p>
          <span class="curated-blog-tags" aria-label="글 태그">${tagMarkup}</span>
          <span class="curated-blog-card-action">글 읽기 →</span>
        </a>`;
    })
    .join("\n");
  return `        <div class="curated-blog-filter-bar" aria-label="태그로 글 필터링">
          ${filterButtons}
        </div>
        <p class="curated-blog-filter-status" id="curatedBlogFilterStatus" aria-live="polite">전체 ${posts.length}편</p>
        <div class="curated-blog-cards" id="curatedBlogPosts">
${cards}
        </div>`;
}

async function collectWikiHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectWikiHtml(path);
    return entry.isFile() && entry.name.endsWith(".html") ? [path] : [];
  }));
  return nested.flat();
}

function stripGeneratedNote(content) {
  const notePattern = new RegExp(`\\s*${noteStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${noteEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "g");
  const stylePattern = new RegExp(`\\s*${styleMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*<link[^>]+curated-blog\\.css[^>]*>`, "g");
  return content.replace(notePattern, "\n").replace(stylePattern, "");
}

function addGeneratedNote(content, href) {
  const depth = href.split("/").length - 1;
  const rootPrefix = "../".repeat(depth);
  const style = `  ${styleMarker}\n  <link rel="stylesheet" href="${rootPrefix}assets/css/curated-blog.css?v=20260901-1">`;
  const note = `${noteStart}
    <aside class="curated-blog-document-note" aria-label="블로그 글 정보"><strong>기술 블로그</strong><span>이 글은 기술 블로그의 글 목록에서도 볼 수 있습니다.</span><a href="${rootPrefix}blog.html">블로그로 돌아가기 →</a></aside>
${noteEnd}`;
  let updated = content.replace(/\n?<\/head>/i, `\n${style}\n</head>`);
  const breadcrumb = updated.match(/<nav\b[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>[\s\S]*?<\/nav>/i);
  if (!breadcrumb) throw new Error(`Breadcrumb not found in curated document: ${href}`);
  updated = updated.replace(breadcrumb[0], `${breadcrumb[0]}\n${note}`);
  return updated;
}

const catalog = await loadContentCatalog();
const posts = itemsForPlacement(catalog, "blog");
const usedTagIds = new Set(posts.flatMap((post) => post.tagIds));
const blogTags = catalog.tags.filter((tag) => usedTagIds.has(tag.id));
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const documentsByHref = new Map(manifest.documents.map((document) => [document.href, document]));

let blog = await readFile(blogPath, "utf8");
blog = replaceRegion(blog, cardsStart, cardsEnd, renderBlog(blogTags, posts, documentsByHref));
await writeFile(blogPath, blog, "utf8");

const selectedHrefs = new Set(posts.map((item) => item.href));
for (const articlePath of await collectWikiHtml(resolve(wikiRoot, "wiki"))) {
  const href = articlePath.slice(wikiRoot.length + 1).replaceAll("\\", "/");
  const content = await readFile(articlePath, "utf8");
  let updated = stripGeneratedNote(content);
  if (selectedHrefs.has(href)) updated = addGeneratedNote(updated, href);
  if (updated !== content) await writeFile(articlePath, updated, "utf8");
}

console.log(`CURATED_BLOG_BUILD=PASS posts=${posts.length} tags=${blogTags.length}`);
