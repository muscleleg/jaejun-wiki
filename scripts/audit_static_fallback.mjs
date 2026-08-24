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

function textById(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<[^>]+\\bid=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"));
  if (!match) throw new Error(`Element not found: ${id}`);
  return match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sectionById(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<section\\b(?=[^>]*\\bid=["']${escaped}["'])[^>]*>[\\s\\S]*?<\\/section>`, "i"));
  if (!match) throw new Error(`Section not found: ${id}`);
  return match[0];
}

function durationMinutes(text) {
  const normalized = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (normalized === "미기록") return null;
  const hours = normalized.match(/(\d+)시간/);
  const minutes = normalized.match(/(\d+)분/);
  if (!hours && !minutes) throw new Error(`Unsupported study duration: ${normalized}`);
  return {
    minutes: Number(hours?.[1] || 0) * 60 + Number(minutes?.[1] || 0),
    approximate: normalized.startsWith("약 "),
  };
}

function formatDuration(durations) {
  if (!durations.length) return "미기록";
  const totalMinutes = durations.reduce((sum, duration) => sum + duration.minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = [hours ? `${hours}시간` : "", minutes ? `${minutes}분` : ""].filter(Boolean).join(" ") || "0분";
  return `${durations.some((duration) => duration.approximate) ? "약 " : ""}${value}`;
}

const [manifest, graph, homeContent, learningState, homeHtml, wikiHtml, mapHtml, historyHtml, roadmapHtml] = await Promise.all([
  loadJson("knowledge_manifest.json"),
  loadJson("concept_graph.json"),
  loadWindowValue("assets/js/home_content.js", "HOME_CONTENT"),
  loadWindowValue("assets/js/learning_state.js", "LEARNING_STATE"),
  readFile(resolve(wikiRoot, "index.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki.html"), "utf8"),
  readFile(resolve(wikiRoot, "knowledge_map.html"), "utf8"),
  readFile(resolve(wikiRoot, "learning_history.html"), "utf8"),
  readFile(resolve(wikiRoot, "pytorch_professional_roadmap.html"), "utf8"),
]);

const homeProjects = staticRegion(homeHtml, "home-projects");
const homeKnowledge = staticRegion(homeHtml, "home-knowledge");
const homeCoaching = staticRegion(homeHtml, "home-coaching");
const homeRoadmaps = staticRegion(homeHtml, "home-roadmaps");
assertSetEqual(valuesForAttribute(homeProjects, "href"), homeContent.featuredProjects.map((item) => item.href), "Home projects");
assertSetEqual(valuesForAttribute(homeKnowledge, "href"), homeContent.knowledgeAreas.map((item) => item.href), "Home knowledge areas");
assertEqual((homeCoaching.match(/class=["']status-row["']/g) || []).length, 5, "Home coaching rows");
assertSetEqual(valuesForAttribute(homeRoadmaps, "href"), learningState.tracks.map((item) => item.href), "Home roadmaps");
if (textById(homeHtml, "overallCount") !== `${learningState.overall.done} / ${learningState.overall.total}`) {
  throw new Error("Home overall completion count does not match learning_state.js");
}

const wikiFilters = staticRegion(wikiHtml, "wiki-filters");
const wikiStatus = staticRegion(wikiHtml, "wiki-status");
const wikiTree = staticRegion(wikiHtml, "wiki-tree");
const wikiDocumentByHref = new Map(manifest.documents.map((entry) => [entry.href, entry]));
const wikiHierarchy = (entry) => {
  const chain = [];
  const seen = new Set();
  let current = entry;
  while (current && !seen.has(current.href)) {
    chain.unshift(current);
    seen.add(current.href);
    current = current.parentHref ? wikiDocumentByHref.get(current.parentHref) : null;
  }
  return chain;
};
const wikiRootEntries = manifest.documents.filter((entry) => (
  wikiHierarchy(entry).filter((item) => item.categoryKey === entry.categoryKey).length === 1
));
const wikiRootHrefByDocument = new Map(manifest.documents.map((entry) => {
  const sameCategoryPath = wikiHierarchy(entry).filter((item) => item.categoryKey === entry.categoryKey);
  return [entry.href, sameCategoryPath[0]?.href || entry.href];
}));
const wikiDescendantCountByRoot = new Map(wikiRootEntries.map((entry) => [entry.href, 0]));
for (const entry of manifest.documents) {
  const rootHref = wikiRootHrefByDocument.get(entry.href);
  if (rootHref !== entry.href) wikiDescendantCountByRoot.set(rootHref, (wikiDescendantCountByRoot.get(rootHref) || 0) + 1);
}
const wikiExpandableRootCount = [...wikiDescendantCountByRoot.values()].filter((count) => count > 0).length;
assertEqual((wikiFilters.match(/<button\b/g) || []).length, manifest.categories.length + 1, "Wiki category filters");
assertEqual((wikiTree.match(/class=["'][^"']*wiki-search-result[^"']*["']/g) || []).length, manifest.indexedCount, "Wiki document links");
assertSetEqual(valuesForAttribute(wikiTree, "href"), manifest.documents.map((item) => item.href), "Wiki document hrefs");
assertEqual((wikiTree.match(/class=["']wiki-tree-root["']/g) || []).length, wikiRootEntries.length, "Wiki root groups");
assertEqual((wikiTree.match(/class=["']wiki-tree-toggle["']/g) || []).length, wikiExpandableRootCount, "Wiki collapse toggles");
assertEqual((wikiTree.match(/class=["']wiki-tree-children["'] hidden/g) || []).length, wikiExpandableRootCount, "Wiki collapsed child groups");
if (!wikiStatus.includes(String(manifest.indexedCount))) throw new Error("Wiki status does not expose the indexed document count");
if (!wikiStatus.includes(`최상위 ${wikiRootEntries.length}개`)) throw new Error("Wiki status does not expose the top-level document count");

const defaultView = graph.views[0];
if (!defaultView) throw new Error("Concept graph has no default view");
const mapTabs = staticRegion(mapHtml, "map-tabs");
const mapTree = staticRegion(mapHtml, "map-tree");
const mapRelations = staticRegion(mapHtml, "map-relations");
const expectedOccurrenceIds = graph.occurrences.filter((item) => item.viewId === defaultView.id).map((item) => item.id);
const expectedRelationPathIds = [];
for (const view of graph.views) {
  const occurrenceIds = graph.occurrences.filter((item) => item.viewId === view.id).map((item) => item.id);
  const parentIds = new Set(graph.edges.filter((edge) => edge.viewId === view.id).map((edge) => edge.source));
  const leafCount = occurrenceIds.filter((id) => !parentIds.has(id)).length;
  for (let index = 1; index <= leafCount; index += 1) expectedRelationPathIds.push(`${view.id}:${index}`);
}
assertEqual((mapTabs.match(/<button\b/g) || []).length, graph.views.length, "Knowledge-map tabs");
assertEqual((mapRelations.match(/class=["']map-relation-view["']/g) || []).length, graph.views.length, "Knowledge-map relation views");
assertSetEqual(valuesForAttribute(mapTree, "data-occurrence-id"), expectedOccurrenceIds, "Knowledge-map occurrences");
assertSetEqual(valuesForAttribute(mapRelations, "data-relation-path"), expectedRelationPathIds, "Knowledge-map relation paths");
assertEqual(textById(mapHtml, "mapEmpty"), "", "Knowledge-map static empty message");
if (!mapHtml.includes(defaultView.description)) throw new Error("Knowledge-map default view description is missing from HTML");

assertEqual(textById(roadmapHtml, "roadmapOverallDone"), String(learningState.overall.done), "Roadmap completed count");
assertEqual(textById(roadmapHtml, "roadmapOverallTotal"), String(learningState.overall.total), "Roadmap total count");
const learningRecords = sectionById(historyHtml, "learning-records");
const recordEntries = [...learningRecords.matchAll(/<article\b([^>]*\bclass=["'][^"']*\bday\b[^"']*["'][^>]*)>\s*<time\b(?=[^>]*\bdatetime=["'](\d{4}-\d{2}-\d{2})["'])[^>]*>/gi)]
  .map((match) => ({ attributes: match[1], date: match[2] }));
const recordedDates = recordEntries.map((entry) => entry.date);
const uniqueRecordedDates = [...new Set(recordedDates)].sort().reverse();
assertEqual(recordedDates.length, uniqueRecordedDates.length, "Unique dated learning records");
for (const entry of recordEntries) {
  const id = entry.attributes.match(/\bid=["']([^"']+)["']/i)?.[1] || "";
  assertEqual(id, `study-${entry.date}`, `Learning-record anchor for ${entry.date}`);
}
assertEqual(textById(historyHtml, "historyLearningDayCount"), `${uniqueRecordedDates.length}일`, "Learning-history day count");
assertEqual(textById(historyHtml, "historyLatestLearningDate"), uniqueRecordedDates[0], "Learning-history latest date");
assertEqual(learningState.updated, uniqueRecordedDates[0], "Learning-state latest date");
const studyTime = sectionById(historyHtml, "study-time");
const sessionDates = [...studyTime.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bsession\b[^"']*["'])[^>]*>[\s\S]*?<time\b(?=[^>]*\bdatetime=["'](\d{4}-\d{2}-\d{2})["'])[^>]*>[\s\S]*?<div\b(?=[^>]*\bclass=["'][^"']*\bduration\b[^"']*["'])[^>]*>([\s\S]*?)<\/div>/gi)]
  .map((match) => ({ date: match[1], duration: durationMinutes(match[2]) }));
assertEqual(sessionDates.length, new Set(sessionDates.map((entry) => entry.date)).size, "Unique study-time sessions");
for (const { date } of sessionDates) {
  if (!uniqueRecordedDates.includes(date)) throw new Error(`Study-time session has no dated learning record: ${date}`);
}
assertEqual(
  textById(historyHtml, "historyRecordedStudyTime"),
  formatDuration(sessionDates.map((entry) => entry.duration).filter(Boolean)),
  "Recorded study-time total",
);

console.log(
  `STATIC_FALLBACK_AUDIT=PASS homeProjects=${homeContent.featuredProjects.length} homeKnowledge=${homeContent.knowledgeAreas.length} wikiDocuments=${manifest.indexedCount} mapOccurrences=${expectedOccurrenceIds.length} mapRelations=${expectedRelationPathIds.length} overall=${learningState.overall.done}/${learningState.overall.total} learningDays=${uniqueRecordedDates.length} studyTime=${textById(historyHtml, "historyRecordedStudyTime")} latest=${uniqueRecordedDates[0]}`,
);
