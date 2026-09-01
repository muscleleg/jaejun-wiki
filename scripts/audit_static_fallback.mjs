import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { itemsForPlacement, loadContentCatalog } from "./content_catalog.mjs";

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

function decodeEntities(value) {
  return String(value || "")
    .replaceAll("&middot;", "·")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function normalizeText(value) {
  return decodeEntities(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function textByClass(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<[^>]+\\bclass=["'][^"']*\\b${escaped}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"));
  if (!match) throw new Error(`Element not found for class: ${className}`);
  return normalizeText(match[1]);
}

function blockByDataValue(html, attribute, value, tag = "li") {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<${tag}\\b([^>]*\\b${escapedAttribute}=["']${escapedValue}["'][^>]*)>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) throw new Error(`Element not found: ${attribute}=${value}`);
  return { attributes: match[1], content: match[2], html: match[0] };
}

function textById(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<[^>]+\\bid=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, "i"));
  if (!match) throw new Error(`Element not found: ${id}`);
  return normalizeText(match[1]);
}

function sectionById(html, id) {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = html.match(new RegExp(`<section\\b(?=[^>]*\\bid=["']${escaped}["'])[^>]*>[\\s\\S]*?<\\/section>`, "i"));
  if (!match) throw new Error(`Section not found: ${id}`);
  return match[0];
}

function completionGateCount(html, label) {
  const match = html.match(/<section[^>]*>\s*<h2>완료 조건<\/h2>([\s\S]*?)<\/section>/i);
  if (!match) throw new Error(`${label} completion gate section is missing`);
  const checks = [...match[1].matchAll(/class=["']check(?:\s+done)?["']/g)].map((item) => /\bdone\b/.test(item[0]));
  if (!checks.length) throw new Error(`${label} completion gate is empty`);
  return { done: checks.filter(Boolean).length, total: checks.length };
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

const [manifest, graph, contentCatalog, homeContent, learningState, codingTestState, reviewState, learningHistoryData, homeHtml, topLevelRoadmapHtml, wikiHtml, mapHtml, historyHtml, backlogHtml, reviewHtml, roadmapHtml, codingTestIndexHtml] = await Promise.all([
  loadJson("knowledge_manifest.json"),
  loadJson("concept_graph.json"),
  loadContentCatalog(),
  loadWindowValue("assets/js/home_content.js", "HOME_CONTENT"),
  loadWindowValue("assets/js/learning_state.js", "LEARNING_STATE"),
  loadWindowValue("assets/js/coding_test_state.js", "CODING_TEST_STATE"),
  loadJson("assets/data/review_state.json"),
  loadJson("assets/data/learning_history.json"),
  readFile(resolve(wikiRoot, "index.html"), "utf8"),
  readFile(resolve(wikiRoot, "roadmap.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki.html"), "utf8"),
  readFile(resolve(wikiRoot, "knowledge_map.html"), "utf8"),
  readFile(resolve(wikiRoot, "learning_history.html"), "utf8"),
  readFile(resolve(wikiRoot, "learning_backlog.html"), "utf8"),
  readFile(resolve(wikiRoot, "learning_review.html"), "utf8"),
  readFile(resolve(wikiRoot, "pytorch_professional_roadmap.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki/coding-test/index.html"), "utf8"),
]);

const homeProjects = staticRegion(homeHtml, "home-projects");
const homeKnowledge = staticRegion(homeHtml, "home-knowledge");
const expectedProjectPageItems = itemsForPlacement(contentCatalog, "projects");
const expectedHomeProjects = expectedProjectPageItems.slice(0, 5);
assertSetEqual(valuesForAttribute(homeProjects, "href"), expectedHomeProjects.map((item) => item.href), "Home projects");
assertEqual(valuesForAttribute(homeProjects, "href").join("|"), expectedHomeProjects.map((item) => item.href).join("|"), "Home project date/pin order");
assertSetEqual(valuesForAttribute(homeKnowledge, "href"), homeContent.knowledgeAreas.map((item) => item.href), "Home knowledge areas");
assertEqual(valuesForAttribute(homeKnowledge, "href").join("|"), homeContent.knowledgeAreas.map((item) => item.href).join("|"), "Home knowledge area order");
assertEqual(textById(homeHtml, "wikiDocumentCount"), `${manifest.documentCount}개 기술 문서`, "Home wiki document count");
if (typeof learningState.recentCompletion !== "string" || !learningState.recentCompletion.trim()) {
  throw new Error("Learning-state recentCompletion must be a non-empty string");
}
assertEqual(
  learningState.overall.done,
  learningState.tracks.reduce((sum, track) => sum + track.done, 0),
  "Learning-state overall completed count",
);
assertEqual(
  learningState.overall.total,
  learningState.tracks.reduce((sum, track) => sum + track.total, 0),
  "Learning-state overall total count",
);
for (const track of learningState.tracks) {
  const childRoadmapHtml = await readFile(resolve(wikiRoot, track.href.split("#")[0]), "utf8");
  const childGate = completionGateCount(childRoadmapHtml, track.id);
  assertEqual(track.done, childGate.done, `${track.id} completed count`);
  assertEqual(track.total, childGate.total, `${track.id} total count`);
}
if (!/<a\b[^>]*\bid=["']roadmaps["'][^>]*\bhref=["']roadmap\.html["'][^>]*>/i.test(homeHtml)) {
  throw new Error("Home roadmap anchor must preserve #roadmaps and link to the top-level roadmap");
}

const topLevelRoadmapTracks = staticRegion(topLevelRoadmapHtml, "top-level-roadmap-tracks");
assertEqual(valuesForAttribute(topLevelRoadmapTracks, "data-roadmap-id").join("|"), "ai-ml", "Primary roadmap order");
const optionalSessionRoadmaps = staticRegion(topLevelRoadmapHtml, "optional-session-roadmaps");
assertEqual(valuesForAttribute(optionalSessionRoadmaps, "data-roadmap-id").join("|"), "coding-test", "Optional-session roadmap order");
const aiCurrentMilestone = learningState.journey.milestones.find((item) => item.id === learningState.journey.currentId);
const codingCurrentMilestone = codingTestState.journey.milestones.find((item) => item.id === codingTestState.journey.currentId);
if (!aiCurrentMilestone || !codingCurrentMilestone) throw new Error("Top-level roadmap current milestone is missing");
const codingCompletedCount = codingTestState.journey.milestones.filter((item) => item.status === "complete").length;
const topLevelExpectations = [
  { region: topLevelRoadmapTracks, id: "ai-ml", href: "pytorch_professional_roadmap.html", values: [learningState.priorityPolicy.label, learningState.priorityPolicy.title, aiCurrentMilestone.title, learningState.rotation.next, `코어 완료 조건 ${learningState.overall.done} / ${learningState.overall.total}`] },
  { region: optionalSessionRoadmaps, id: "coding-test", href: "wiki/coding-test/index.html", values: ["사용자 선택 세션", "코딩 테스트 역량 로드맵", codingCurrentMilestone.title, codingCurrentMilestone.goal, `성취 관문 ${codingCompletedCount} / ${codingTestState.journey.milestones.length}`] },
];
for (const expectation of topLevelExpectations) {
  const card = blockByDataValue(expectation.region, "data-roadmap-id", expectation.id, "article");
  const cardText = normalizeText(card.html);
  for (const value of expectation.values) {
    if (!cardText.includes(normalizeText(value))) throw new Error(`Top-level roadmap ${expectation.id} is missing: ${value}`);
  }
  if (!valuesForAttribute(card.html, "href").includes(expectation.href)) throw new Error(`Top-level roadmap ${expectation.id} href is stale`);
}
if (/전체\s*(?:진행률|완료율)|통합\s*(?:진행률|완료율)/.test(normalizeText(`${topLevelRoadmapTracks} ${optionalSessionRoadmaps}`))) {
  throw new Error("Top-level roadmap must not merge AI and coding-test progress into one percentage");
}
for (const value of [learningState.priorityPolicy.rule, learningState.priorityPolicy.supportRule, learningState.priorityPolicy.optionalRule]) {
  if (!normalizeText(topLevelRoadmapHtml).includes(normalizeText(value))) {
    throw new Error(`Top-level roadmap priority policy is missing: ${value}`);
  }
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
assertSetEqual(
  valuesForAttribute(wikiTree, "id").filter((id) => id.startsWith("wiki-category-")),
  manifest.categories.map((category) => `wiki-category-${category.id}`),
  "Wiki category anchors",
);
if (!wikiStatus.includes(String(manifest.indexedCount))) throw new Error("Wiki status does not expose the indexed document count");
if (!wikiStatus.includes(`최상위 ${wikiRootEntries.length}개`)) throw new Error("Wiki status does not expose the top-level document count");

const defaultView = graph.views[0];
if (!defaultView) throw new Error("Concept graph has no default view");
const mapTabs = staticRegion(mapHtml, "map-tabs");
const mapTree = staticRegion(mapHtml, "map-tree");
const mapRelations = staticRegion(mapHtml, "map-relations");
const expectedOccurrenceIds = graph.occurrences.filter((item) => item.viewId === defaultView.id).map((item) => item.id);
const mapOccurrenceById = new Map(graph.occurrences.map((occurrence) => [occurrence.id, occurrence]));
const expectedRelationPaths = new Map();
for (const view of graph.views) {
  const childrenById = new Map();
  for (const edge of graph.edges.filter((edge) => edge.viewId === view.id)) {
    const children = childrenById.get(edge.source) || [];
    children.push(edge.target);
    childrenById.set(edge.source, children);
  }
  const paths = [];
  function visit(occurrenceId, path, seen) {
    if (seen.has(occurrenceId)) throw new Error(`Knowledge-map cycle in ${view.id}: ${occurrenceId}`);
    const occurrence = mapOccurrenceById.get(occurrenceId);
    if (!occurrence) throw new Error(`Knowledge-map occurrence is missing: ${occurrenceId}`);
    const nextPath = [...path, { label: occurrence.label, href: occurrence.href || null }];
    const children = childrenById.get(occurrenceId) || [];
    if (!children.length) {
      paths.push(nextPath);
      return;
    }
    const nextSeen = new Set(seen).add(occurrenceId);
    for (const childId of children) visit(childId, nextPath, nextSeen);
  }
  visit(view.rootOccurrenceId, [], new Set());
  paths.forEach((path, index) => expectedRelationPaths.set(`${view.id}:${index + 1}`, path));
}
const expectedRelationPathIds = [...expectedRelationPaths.keys()];
assertEqual((mapTabs.match(/<button\b/g) || []).length, graph.views.length, "Knowledge-map tabs");
assertEqual((mapRelations.match(/class=["']map-relation-view["']/g) || []).length, graph.views.length, "Knowledge-map relation views");
assertSetEqual(valuesForAttribute(mapTree, "data-occurrence-id"), expectedOccurrenceIds, "Knowledge-map occurrences");
assertSetEqual(valuesForAttribute(mapRelations, "data-relation-path"), expectedRelationPathIds, "Knowledge-map relation paths");
for (const view of graph.views) {
  const viewBlock = blockByDataValue(mapRelations, "data-view", view.id, "section");
  const heading = normalizeText(viewBlock.content.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
  const description = normalizeText(viewBlock.content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
  assertEqual(heading, view.label, `Knowledge-map relation heading ${view.id}`);
  assertEqual(description, view.description, `Knowledge-map relation description ${view.id}`);
}
for (const [pathId, expectedPath] of expectedRelationPaths) {
  const pathBlock = blockByDataValue(mapRelations, "data-relation-path", pathId);
  const actualPath = [...pathBlock.content.matchAll(/<(a|span)([^>]*)>([\s\S]*?)<\/\1>/gi)]
    .filter((match) => !/\bmap-relation-arrow\b/.test(match[2]))
    .map((match) => ({
      label: normalizeText(match[3]),
      href: match[1].toLowerCase() === "a" ? match[2].match(/\bhref=["']([^"']+)["']/i)?.[1] || null : null,
    }));
  assertEqual(JSON.stringify(actualPath), JSON.stringify(expectedPath), `Knowledge-map relation path ${pathId}`);
}
assertEqual(textById(mapHtml, "mapEmpty"), "", "Knowledge-map static empty message");
if (!mapHtml.includes(defaultView.description)) throw new Error("Knowledge-map default view description is missing from HTML");

assertEqual(textById(roadmapHtml, "roadmapOverallDone"), String(learningState.overall.done), "Roadmap completed count");
assertEqual(textById(roadmapHtml, "roadmapOverallTotal"), String(learningState.overall.total), "Roadmap total count");
assertEqual(textById(roadmapHtml, "roadmapProgressDone"), String(learningState.overall.done), "Roadmap progress completed count");
assertEqual(textById(roadmapHtml, "roadmapProgressTotal"), String(learningState.overall.total), "Roadmap progress total count");
const roadmapProgress = staticRegion(roadmapHtml, "roadmap-progress");
const expectedRoadmapPercent = learningState.overall.total ? learningState.overall.done / learningState.overall.total * 100 : 0;
if (!roadmapProgress.includes(`style="width:${expectedRoadmapPercent.toFixed(1)}%"`)) {
  throw new Error(`Roadmap progress width must be ${expectedRoadmapPercent.toFixed(1)}%`);
}

const roadmapTracks = staticRegion(roadmapHtml, "roadmap-tracks");
assertEqual(
  valuesForAttribute(roadmapTracks, "data-track-id").join("|"),
  learningState.tracks.map((track) => track.id).join("|"),
  "Integrated roadmap track order",
);
const currentMilestone = learningState.journey.milestones.find((milestone) => milestone.id === learningState.journey.currentId);
if (!currentMilestone) throw new Error(`Current learning milestone is missing: ${learningState.journey.currentId}`);
const currentRoadmapHref = currentMilestone.href.split("#")[0];
const currentTrackId = learningState.tracks.find((track) => track.href.split("#")[0] === currentRoadmapHref)?.id;
for (const track of learningState.tracks) {
  const card = blockByDataValue(roadmapTracks, "data-track-id", track.id, "article");
  const cardText = normalizeText(card.html);
  const percent = Math.round(track.done / track.total * 100);
  const isCurrent = track.id === currentTrackId;
  const phase = isCurrent ? "현재 활성" : track.done === track.total ? "완료" : "대기";
  const expectedCurrent = isCurrent ? currentMilestone.title : track.current;
  const expectedNext = isCurrent ? currentMilestone.goal : track.next;
  for (const value of [track.title, expectedCurrent, expectedNext, `${phase} · ${percent}% · ${track.done}/${track.total}`]) {
    if (!cardText.includes(normalizeText(value))) throw new Error(`Integrated roadmap track ${track.id} is missing: ${value}`);
  }
  const expectedHref = isCurrent ? currentMilestone.href : track.href;
  if (!valuesForAttribute(card.html, "href").includes(expectedHref)) {
    throw new Error(`Integrated roadmap track ${track.id} href is stale`);
  }
}

const roadmapCoaching = staticRegion(roadmapHtml, "roadmap-coaching");
assertEqual((roadmapCoaching.match(/class=["']status-line["']/g) || []).length, 5, "Integrated roadmap coaching rows");
for (const value of [
  learningState.coaching.recentEvidence,
  learningState.coaching.diagnosis,
  learningState.coaching.warning,
  learningState.coaching.completionGate,
  learningState.coaching.scheduledRotation,
]) {
  if (!normalizeText(roadmapCoaching).includes(normalizeText(value))) {
    throw new Error(`Integrated roadmap coaching value is missing: ${value}`);
  }
}
const completedProblemSection = sectionById(codingTestIndexHtml, "problems");
const attemptNoteSection = sectionById(codingTestIndexHtml, "attempt-notes");
const completedProblemHrefs = valuesForAttribute(completedProblemSection, "href").filter((href) => href.endsWith(".html") && !href.startsWith("https://"));
const attemptNoteHrefs = valuesForAttribute(attemptNoteSection, "href").filter((href) => href.endsWith(".html") && !href.startsWith("https://"));
const completedProblemNumbers = [...completedProblemSection.matchAll(/<strong>\s*(\d+)\s*·/g)].map((match) => Number(match[1]));
assertEqual(completedProblemHrefs.length, new Set(completedProblemHrefs).size, "Unique completed coding-test documents");
assertEqual(completedProblemNumbers.join(","), completedProblemNumbers.map((_, index) => index + 1).join(","), "Sequential completed coding-test numbers");
if (!codingTestIndexHtml.includes(`현재 풀이 증거<strong>${completedProblemHrefs.length}문제</strong>`)) {
  throw new Error(`Coding-test summary count does not match completed cards: ${completedProblemHrefs.length}`);
}
for (const href of attemptNoteHrefs) {
  if (completedProblemHrefs.includes(href)) throw new Error(`Coding-test attempt note is also counted as completed: ${href}`);
}
const learningRecords = sectionById(historyHtml, "learning-records");
const recordEntries = [...learningRecords.matchAll(/<article\b([^>]*\bclass=["'][^"']*\bday\b[^"']*["'][^>]*)>\s*<div\b[^>]*\bclass=["'][^"']*\bday-heading\b[^"']*["'][^>]*>\s*<time\b(?=[^>]*\bdatetime=["'](\d{4}-\d{2}-\d{2})["'])[^>]*>/gi)]
  .map((match) => ({ attributes: match[1], date: match[2] }));
const recordedDates = recordEntries.map((entry) => entry.date);
const uniqueRecordedDates = [...new Set(recordedDates)].sort().reverse();
if (learningHistoryData.version !== 1 || !Array.isArray(learningHistoryData.records) || !learningHistoryData.records.length) {
  throw new Error("Learning-history JSON must contain version 1 records");
}
const jsonRecordDates = learningHistoryData.records.map((record) => record.date);
assertEqual(jsonRecordDates.length, new Set(jsonRecordDates).size, "Unique learning-history JSON dates");
assertEqual(jsonRecordDates.join("|"), [...jsonRecordDates].sort().reverse().join("|"), "Learning-history JSON newest-first order");
assertEqual(recordedDates.length, uniqueRecordedDates.length, "Unique dated learning records");
assertEqual(recordedDates.join("|"), uniqueRecordedDates.join("|"), "Learning records newest-first order");
assertEqual(recordedDates.join("|"), jsonRecordDates.join("|"), "Learning records rendered from JSON");
for (const entry of recordEntries) {
  const id = entry.attributes.match(/\bid=["']([^"']+)["']/i)?.[1] || "";
  assertEqual(id, `study-${entry.date}`, `Learning-record anchor for ${entry.date}`);
}
const expectedTopicCount = learningHistoryData.records.reduce((sum, record) => sum + record.topics.length, 0);
assertEqual((learningRecords.match(/<div\b[^>]*\bclass=["'][^"']*\btopic\b[^"']*["']/gi) || []).length, expectedTopicCount, "Learning topic count from JSON");
for (const record of learningHistoryData.records) {
  for (const topic of record.topics) {
    if (!normalizeText(learningRecords).includes(normalizeText(topic.titleHtml)) || !normalizeText(learningRecords).includes(normalizeText(topic.bodyHtml))) {
      throw new Error(`Learning-history JSON topic missing from HTML: ${record.date}`);
    }
  }
}
const learningCalendar = staticRegion(historyHtml, "learning-calendar");
assertSetEqual(
  valuesForAttribute(learningCalendar, "href").filter((href) => href.startsWith("#study-")),
  jsonRecordDates.map((date) => `#study-${date}`),
  "Learning calendar dates from JSON",
);
for (const token of ["activity-year", "activity-grid"]) {
  if (!learningCalendar.includes(token)) throw new Error(`Learning activity calendar token is missing: ${token}`);
}
for (const token of ["1~29분", "30~59분", "60~119분", "120분 이상", "시간 미기록"]) {
  if (!historyHtml.includes(token)) throw new Error(`Learning activity legend token is missing: ${token}`);
}
for (const record of learningHistoryData.records) {
  const anchor = learningCalendar.match(new RegExp(`<a\\b(?=[^>]*\\bhref=["']#study-${record.date}["'])([^>]*)>`, "i"));
  if (!anchor) throw new Error(`Learning activity day is missing: ${record.date}`);
  const expectedLevel = !record.studyTime
    ? "unrecorded"
    : record.studyTime.minutes < 30
      ? "1"
      : record.studyTime.minutes < 60
        ? "2"
        : record.studyTime.minutes < 120
          ? "3"
          : "4";
  assertEqual(anchor[1].match(/\bdata-activity-level=["']([^"']+)["']/i)?.[1] || "", expectedLevel, `Learning activity level ${record.date}`);
  if (!new RegExp(`\\blevel-${expectedLevel}\\b`).test(anchor[1])) throw new Error(`Learning activity class mismatch: ${record.date}`);
}
assertEqual(textById(historyHtml, "historyLearningDayCount"), `${uniqueRecordedDates.length}일`, "Learning-history day count");
assertEqual(textById(historyHtml, "historyLatestLearningDate"), uniqueRecordedDates[0], "Learning-history latest date");
assertEqual(learningState.updated, uniqueRecordedDates[0], "Learning-state latest date");
function assertJourneyMatches(region, journey, label, presentation = {}) {
  const expectedTitle = presentation.title || journey.title;
  const expectedSummary = presentation.summary || journey.summary;
  const expectedFinalOutcome = presentation.finalOutcome || journey.finalOutcome;
  const heading = normalizeText(region.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "");
  const summary = normalizeText(region.match(/<div\b[^>]*class=["'][^"']*journey-heading[^"']*["'][^>]*>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
  assertEqual(heading, expectedTitle, `${label} title`);
  assertEqual(summary, expectedSummary, `${label} summary`);
  if (presentation.interactionHint && !normalizeText(region).includes(normalizeText(presentation.interactionHint))) {
    throw new Error(`${label} interaction hint is missing`);
  }
  if (!normalizeText(region).includes(normalizeText(expectedFinalOutcome))) throw new Error(`${label} final outcome is missing`);

  const actualIds = valuesForAttribute(region, "data-milestone-id");
  const expectedIds = journey.milestones.map((milestone) => milestone.id);
  assertEqual(actualIds.join("|"), expectedIds.join("|"), `${label} milestone order`);
  assertEqual(new Set(actualIds).size, actualIds.length, `${label} unique milestone IDs`);
  assertEqual(journey.milestones.filter((milestone) => milestone.status === "current").length, 1, `${label} state current count`);
  assertEqual(journey.milestones.find((milestone) => milestone.status === "current")?.id, journey.currentId, `${label} currentId`);
  assertEqual((region.match(/aria-current=["']step["']/g) || []).length, 1, `${label} current marker count`);

  for (const milestone of journey.milestones) {
    const block = blockByDataValue(region, "data-milestone-id", milestone.id);
    const classValue = block.attributes.match(/\bclass=["']([^"']+)["']/i)?.[1] || "";
    if (!classValue.split(/\s+/).includes(`is-${milestone.status}`)) {
      throw new Error(`${label} status class mismatch: ${milestone.id}`);
    }
    const isCurrent = /\baria-current=["']step["']/i.test(block.attributes);
    assertEqual(isCurrent, milestone.id === journey.currentId, `${label} current milestone ${milestone.id}`);
    assertEqual(textByClass(block.content, "journey-label"), milestone.shortTitle, `${label} short title ${milestone.id}`);
    const title = normalizeText(block.content.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] || "");
    assertEqual(title, milestone.title, `${label} title ${milestone.id}`);
    assertEqual(textByClass(block.content, "journey-status"), milestone.statusLabel, `${label} status ${milestone.id}`);
    if (!normalizeText(block.content).includes(normalizeText(milestone.goal))) throw new Error(`${label} goal is missing: ${milestone.id}`);
    if (!normalizeText(block.content).includes(normalizeText(milestone.evidence))) throw new Error(`${label} evidence is missing: ${milestone.id}`);
    const expectedDetailHrefs = milestone.practiceHref ? [milestone.practiceHref] : [];
    assertEqual(valuesForAttribute(block.content, "href").join("|"), expectedDetailHrefs.join("|"), `${label} practice href ${milestone.id}`);
  }
}

if (!homeHtml.includes('assets/js/learning_journey.js')) throw new Error("Home learning-journey interaction script is missing");
if (!homeHtml.includes('assets/js/home_projects.js')) throw new Error("Home project horizontal-rail interaction script is missing");
for (const id of ["featuredProjectGrid", "projectRailStatus", "projectRailPrevious", "projectRailNext"]) {
  if (!homeHtml.includes(`id="${id}"`)) throw new Error(`Home project horizontal-rail control is missing: ${id}`);
}
const homeLearningJourney = staticRegion(homeHtml, "home-learning-journey");
assertJourneyMatches(homeLearningJourney, learningState.journey, "Home learning journey", learningState.journey.homePresentation);
if (!/<section\b[^>]*id=["']now-learning["'][\s\S]*?<\/section>\s*<section\b[^>]*id=["']projects["']/i.test(homeHtml)) {
  throw new Error("Home learning journey must be the section immediately before personal projects");
}
if (homeHtml.includes('id="codingTestJourney"')) throw new Error("Coding-test journey must not be rendered on the home page");
if (/\bid=["'](?:recentCompletion|currentLearning|currentNextAction|coachingStatus)["']/i.test(homeHtml)) {
  throw new Error("Legacy current-learning summary must not duplicate the home journey");
}
if (!historyHtml.includes('assets/js/learning_journey.js')) throw new Error("Learning-journey interaction script is missing");
const learningJourney = staticRegion(historyHtml, "learning-journey");
assertJourneyMatches(learningJourney, learningState.journey, "Learning journey");
if (!/<\/header>\s*<section\b[^>]*id=["']study-calendar["'][\s\S]*?<\/section>\s*<!-- learning-calendar-placement -->\s*<section\b[^>]*id=["']primary-learning-journey["']/i.test(historyHtml)) {
  throw new Error("Learning calendar must follow the top summary and precede the primary learning journey");
}
if (historyHtml.includes('id="review-queue"') || historyHtml.includes('id="deferred-learning"')) throw new Error("Backlog and review sections must not remain on the learning-history page");
if (historyHtml.includes('assets/css/review-queue.css') || historyHtml.includes('assets/js/review_queue.js')) throw new Error("Review-only assets must not remain on the learning-history page");
if (!reviewHtml.includes('assets/css/review-queue.css')) throw new Error("Review-queue stylesheet is missing from the review page");
if (!reviewHtml.includes('assets/js/review_queue.js')) throw new Error("Review-queue interaction script is missing from the review page");
if (!reviewHtml.includes('type="application/json" href="assets/data/review_state.json"')) throw new Error("Review JSON alternate link is missing from the review page");
if (!reviewHtml.includes('<h1>기억 강화 세션</h1>')) throw new Error("Memory reinforcement page heading is missing");
if (!reviewHtml.includes('title="기억 강화 세션 상태 데이터"')) throw new Error("Memory reinforcement JSON label is missing");
if (!backlogHtml.includes('<h1>나중에 다시 할 학습</h1>')) throw new Error("Deferred-learning page heading is missing");

for (const milestone of learningState.journey.milestones) {
  const needsPracticeDocument = milestone.status === "complete" || milestone.status === "current";
  if (needsPracticeDocument && !milestone.practiceHref) {
    throw new Error(`Practice document is required for active evidence: ${milestone.id}`);
  }
  if (!needsPracticeDocument && milestone.practiceHref) {
    throw new Error(`Upcoming milestone must not publish an empty practice document: ${milestone.id}`);
  }
  if (!milestone.practiceHref) continue;
  if (!manifest.documents.some((entry) => entry.href === milestone.practiceHref.split("#")[0])) {
    throw new Error(`Practice document is missing from the knowledge manifest: ${milestone.id}`);
  }
  const practicePath = resolve(wikiRoot, milestone.practiceHref.split("#")[0]);
  const practiceHtml = await readFile(practicePath, "utf8");
  if (!practiceHtml.includes(`data-learning-milestone="${milestone.id}"`)) {
    throw new Error(`Practice document milestone ID mismatch: ${milestone.id}`);
  }
  if (!practiceHtml.includes(`data-milestone-status="${milestone.status}"`)) {
    throw new Error(`Practice document status mismatch: ${milestone.id}`);
  }
}
const reviewQueue = staticRegion(reviewHtml, "review-queue");
for (const expectedText of [
  reviewState.policy.attemptRule,
  reviewState.policy.overflowRule,
  reviewState.policy.evidenceRule,
  reviewState.policy.enrollmentRule,
  reviewState.policy.directionRule,
  reviewState.policy.selectionRule,
  String(reviewState.policy.maxPerSession),
  String(reviewState.policy.timeBudgetMinutes),
  ...reviewState.directions.flatMap((direction) => [direction.label, direction.description]),
  ...reviewState.policy.resultTypes.flatMap((type) => [type.label, type.description]),
]) {
  if (!normalizeText(reviewQueue).includes(normalizeText(expectedText))) throw new Error(`Review queue policy text is missing: ${expectedText}`);
}
const reviewIds = valuesForAttribute(reviewQueue, "data-review-id");
const expectedReviewIds = [...reviewState.items]
  .sort((left, right) => left.nextDue.localeCompare(right.nextDue) || left.priority - right.priority)
  .map((item) => item.id);
assertEqual(reviewIds.join("|"), expectedReviewIds.join("|"), "Review queue item order");
assertEqual(new Set(reviewIds).size, reviewIds.length, "Unique review queue items");
for (const item of reviewState.items) {
  const block = blockByDataValue(reviewQueue, "data-review-id", item.id, "article");
  const attribute = (name) => block.attributes.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || "";
  assertEqual(attribute("data-prompt-type"), item.promptType, `Review prompt type ${item.id}`);
  assertEqual(attribute("data-topic-label"), item.topicLabel, `Review topic ${item.id}`);
  assertEqual(attribute("data-priority"), String(item.priority), `Review priority ${item.id}`);
  assertEqual(attribute("data-next-due"), item.nextDue, `Review next due ${item.id}`);
  assertEqual(attribute("data-stage-index"), String(item.stageIndex), `Review stage ${item.id}`);
  assertEqual(attribute("data-result-count"), String(item.results.length), `Review result count ${item.id}`);
  assertEqual(attribute("data-last-reviewed"), item.lastReviewed || "", `Review last reviewed ${item.id}`);
  assertEqual(attribute("data-last-outcome"), item.results.at(-1)?.outcome || "", `Review last outcome ${item.id}`);
  const delayedResults = (item.results || []).filter((result) => Number(result.delayDays) >= 1);
  const delayedSuccesses = delayedResults.filter((result) => ["recalled", "transferred"].includes(result.outcome));
  assertEqual(attribute("data-delayed-attempts"), String(delayedResults.length), `Review delayed attempts ${item.id}`);
  assertEqual(attribute("data-delayed-successes"), String(delayedSuccesses.length), `Review delayed successes ${item.id}`);
  for (const expectedText of [item.title, item.prompt, item.acquisitionEvidence, ...item.evidenceCriteria]) {
    if (!normalizeText(block.content).includes(normalizeText(expectedText))) throw new Error(`Review queue text is missing: ${item.id}`);
  }
  assertEqual(valuesForAttribute(block.content, "href").join("|"), item.sourceHref, `Review source href ${item.id}`);
  await readFile(resolve(wikiRoot, item.sourceHref.split("#")[0]), "utf8");
}
const deferredLearning = staticRegion(backlogHtml, "deferred-learning-items");
for (const expectedText of [
  learningState.deferredLearningItems.policy.reviewWhen,
  String(learningState.deferredLearningItems.policy.activeLimit),
  String(learningState.deferredLearningItems.policy.repeatThreshold),
  ...learningState.deferredLearningItems.policy.types.flatMap((type) => [type.label, type.activation]),
]) {
  if (!normalizeText(deferredLearning).includes(normalizeText(expectedText))) throw new Error("Deferred learning policy text is missing");
}
const deferredIds = valuesForAttribute(deferredLearning, "data-deferred-id");
const expectedDeferredIds = learningState.deferredLearningItems.items.map((item) => item.id);
assertEqual(deferredIds.join("|"), expectedDeferredIds.join("|"), "Deferred learning item order");
assertEqual(new Set(deferredIds).size, deferredIds.length, "Unique deferred learning items");
for (const item of learningState.deferredLearningItems.items) {
  const block = blockByDataValue(deferredLearning, "data-deferred-id", item.id, "article");
  assertEqual(block.attributes.match(/\bdata-deferred-status=["']([^"']+)["']/i)?.[1] || "", item.status, `Deferred learning status ${item.id}`);
  assertEqual(block.attributes.match(/\bdata-deferred-type=["']([^"']+)["']/i)?.[1] || "", item.type, `Deferred learning type ${item.id}`);
  const type = learningState.deferredLearningItems.policy.types.find((candidate) => candidate.id === item.type);
  if (!type) throw new Error(`Deferred learning type is unknown: ${item.type}`);
  for (const expectedText of [item.statusLabel, item.title, item.reason, item.resumeWhen, item.completion]) {
    if (!normalizeText(block.content).includes(normalizeText(expectedText))) throw new Error(`Deferred learning text is missing: ${item.id}`);
  }
  assertEqual(valuesForAttribute(block.content, "href").join("|"), item.href, `Deferred learning href ${item.id}`);
}
const activeDeferredCount = learningState.deferredLearningItems.items.filter((item) => item.status === "active").length;
if (activeDeferredCount > learningState.deferredLearningItems.policy.activeLimit) throw new Error("Deferred learning active limit exceeded");
const codingTestJourney = staticRegion(historyHtml, "coding-test-journey");
assertJourneyMatches(codingTestJourney, codingTestState.journey, "Coding-test journey");
const optionalSessionJourneys = sectionById(historyHtml, "optional-session-journeys");
if (!optionalSessionJourneys.includes('id="codingTestJourney"') || optionalSessionJourneys.includes('id="learningJourney"')) {
  throw new Error("Coding-test journey must be contained only in the optional-session journey section");
}
if (!normalizeText(historyHtml).includes(normalizeText(learningState.priorityPolicy.rule))) {
  throw new Error("Learning history must state the primary journey priority rule");
}
if (/<section\b[^>]*\bid=["']study-time["']/i.test(historyHtml)) throw new Error("Standalone study-time section must be removed");
if (!learningRecords.includes('id="study-time"')) throw new Error("Legacy study-time fragment must remain inside learning records");
if (!normalizeText(learningRecords).includes(normalizeText(learningHistoryData.studyTimeNoteHtml))) throw new Error("Study-time note must remain in learning records");
const sessionDates = [];
for (const record of learningHistoryData.records) {
  const dayMatch = learningRecords.match(new RegExp(`<article\\b(?=[^>]*\\bid=["']study-${record.date}["'])[^>]*>[\\s\\S]*?<\\/article>`, "i"));
  if (!dayMatch) throw new Error(`Learning record block is missing: ${record.date}`);
  const dayBlock = dayMatch[0];
  const durationText = textByClass(dayBlock, "day-duration");
  if (!record.studyTime) {
    assertEqual(durationText, "공부시간 미기록", `Unrecorded study-time label ${record.date}`);
    if (/\bday-study-time\b/i.test(dayBlock)) throw new Error(`Unrecorded date must not render study-time detail: ${record.date}`);
    continue;
  }
  const duration = durationMinutes(durationText);
  sessionDates.push({ date: record.date, duration });
  if (!/\bday-study-time\b/i.test(dayBlock)) throw new Error(`Study-time detail is missing from dated record: ${record.date}`);
  for (const expectedText of [record.studyTime.label, record.studyTime.bodyHtml]) {
    if (!normalizeText(dayBlock).includes(normalizeText(expectedText))) throw new Error(`Study-time content is missing from dated record: ${record.date}`);
  }
}
const jsonSessions = learningHistoryData.records.filter((record) => record.studyTime).map((record) => ({
  date: record.date,
  duration: { minutes: record.studyTime.minutes, approximate: record.studyTime.approximate },
}));
assertEqual(sessionDates.length, new Set(sessionDates.map((entry) => entry.date)).size, "Unique study-time sessions");
assertEqual(sessionDates.map((entry) => entry.date).join("|"), jsonSessions.map((entry) => entry.date).join("|"), "Study-time dates rendered from JSON");
assertEqual(sessionDates.map((entry) => `${entry.duration?.minutes}:${entry.duration?.approximate}`).join("|"), jsonSessions.map((entry) => `${entry.duration.minutes}:${entry.duration.approximate}`).join("|"), "Study-time values rendered from JSON");
for (const { date } of sessionDates) {
  if (!uniqueRecordedDates.includes(date)) throw new Error(`Study-time session has no dated learning record: ${date}`);
}
assertEqual(
  textById(historyHtml, "historyRecordedStudyTime"),
  formatDuration(jsonSessions.map((entry) => entry.duration)),
  "Recorded study-time total",
);
console.log(
  `STATIC_FALLBACK_AUDIT=PASS homeProjects=${expectedHomeProjects.length} homeKnowledge=${homeContent.knowledgeAreas.length} wikiDocuments=${manifest.indexedCount} mapOccurrences=${expectedOccurrenceIds.length} mapRelations=${expectedRelationPathIds.length} codingProblems=${completedProblemHrefs.length} codingAttemptNotes=${attemptNoteHrefs.length} overall=${learningState.overall.done}/${learningState.overall.total} learningDays=${uniqueRecordedDates.length} studyTime=${textById(historyHtml, "historyRecordedStudyTime")} latest=${uniqueRecordedDates[0]}`,
);
