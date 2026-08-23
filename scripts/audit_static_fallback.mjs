import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");

async function loadJson(path) {
  return JSON.parse(await readFile(resolve(wikiRoot, path), "utf8"));
}

async function loadWindowValue(path, property) {
  const sourcePath = resolve(wikiRoot, path);
  const context = { window: {} };
  runInNewContext(await readFile(sourcePath, "utf8"), context, { filename: sourcePath });
  if (!context.window[property]) throw new Error(`${property} is missing from ${path}`);
  return context.window[property];
}

function staticRegion(html, name) {
  const start = `<!-- static-fallback:${name}:start -->`;
  const end = `<!-- static-fallback:${name}:end -->`;
  if (html.split(start).length !== 2 || html.split(end).length !== 2) {
    throw new Error(`Static fallback marker must occur exactly once: ${name}`);
  }
  const region = html.slice(html.indexOf(start) + start.length, html.indexOf(end));
  if (!region.trim()) throw new Error(`Static fallback region is empty: ${name}`);
  return region;
}

function valuesForAttribute(html, attribute) {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...html.matchAll(new RegExp(`\\b${escaped}=["']([^"']+)["']`, "g"))].map((match) => match[1]);
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
}

function assertSetEqual(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = [...expectedSet].filter((value) => !actualSet.has(value));
  const extra = [...actualSet].filter((value) => !expectedSet.has(value));
  if (missing.length || extra.length || actual.length !== expected.length) {
    throw new Error(`${label}: missing=${missing.join(",") || "none"} extra=${extra.join(",") || "none"} actual=${actual.length} expected=${expected.length}`);
  }
}

const [manifest, graph, homeContent, learningState, homeHtml, wikiHtml, mapHtml] = await Promise.all([
  loadJson("knowledge_manifest.json"),
  loadJson("concept_graph.json"),
  loadWindowValue("assets/js/home_content.js", "HOME_CONTENT"),
  loadWindowValue("assets/js/learning_state.js", "LEARNING_STATE"),
  readFile(resolve(wikiRoot, "index.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki.html"), "utf8"),
  readFile(resolve(wikiRoot, "knowledge_map.html"), "utf8"),
]);

const homeProjects = staticRegion(homeHtml, "home-projects");
const homeKnowledge = staticRegion(homeHtml, "home-knowledge");
const homeCoaching = staticRegion(homeHtml, "home-coaching");
const homeRoadmaps = staticRegion(homeHtml, "home-roadmaps");
assertSetEqual(valuesForAttribute(homeProjects, "href"), homeContent.featuredProjects.map((item) => item.href), "Home projects");
assertSetEqual(valuesForAttribute(homeKnowledge, "href"), homeContent.knowledgeAreas.map((item) => item.href), "Home knowledge areas");
assertEqual((homeCoaching.match(/class=["']status-row["']/g) || []).length, 5, "Home coaching rows");
assertSetEqual(valuesForAttribute(homeRoadmaps, "href"), learningState.tracks.map((item) => item.href), "Home roadmaps");

const wikiFilters = staticRegion(wikiHtml, "wiki-filters");
const wikiStatus = staticRegion(wikiHtml, "wiki-status");
const wikiTree = staticRegion(wikiHtml, "wiki-tree");
assertEqual((wikiFilters.match(/<button\b/g) || []).length, manifest.categories.length + 1, "Wiki category filters");
assertEqual((wikiTree.match(/class=["'][^"']*wiki-search-result[^"']*["']/g) || []).length, manifest.indexedCount, "Wiki document links");
assertSetEqual(valuesForAttribute(wikiTree, "href"), manifest.documents.map((item) => item.href), "Wiki document hrefs");
if (!wikiStatus.includes(String(manifest.indexedCount))) throw new Error("Wiki status does not expose the indexed document count");

const defaultView = graph.views[0];
if (!defaultView) throw new Error("Concept graph has no default view");
const mapTabs = staticRegion(mapHtml, "map-tabs");
const mapTree = staticRegion(mapHtml, "map-tree");
const expectedOccurrenceIds = graph.occurrences.filter((item) => item.viewId === defaultView.id).map((item) => item.id);
assertEqual((mapTabs.match(/<button\b/g) || []).length, graph.views.length, "Knowledge-map tabs");
assertSetEqual(valuesForAttribute(mapTree, "data-occurrence-id"), expectedOccurrenceIds, "Knowledge-map occurrences");
if (!mapHtml.includes(defaultView.description)) throw new Error("Knowledge-map default view description is missing from HTML");

console.log(
  `STATIC_FALLBACK_AUDIT=PASS homeProjects=${homeContent.featuredProjects.length} homeKnowledge=${homeContent.knowledgeAreas.length} wikiDocuments=${manifest.indexedCount} mapOccurrences=${expectedOccurrenceIds.length}`,
);
