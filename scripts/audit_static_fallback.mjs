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

const [manifest, graph, homeContent, learningState, codingTestState, homeHtml, topLevelRoadmapHtml, wikiHtml, mapHtml, historyHtml, roadmapHtml, codingTestIndexHtml] = await Promise.all([
  loadJson("knowledge_manifest.json"),
  loadJson("concept_graph.json"),
  loadWindowValue("assets/js/home_content.js", "HOME_CONTENT"),
  loadWindowValue("assets/js/learning_state.js", "LEARNING_STATE"),
  loadWindowValue("assets/js/coding_test_state.js", "CODING_TEST_STATE"),
  readFile(resolve(wikiRoot, "index.html"), "utf8"),
  readFile(resolve(wikiRoot, "roadmap.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki.html"), "utf8"),
  readFile(resolve(wikiRoot, "knowledge_map.html"), "utf8"),
  readFile(resolve(wikiRoot, "learning_history.html"), "utf8"),
  readFile(resolve(wikiRoot, "pytorch_professional_roadmap.html"), "utf8"),
  readFile(resolve(wikiRoot, "wiki/coding-test/index.html"), "utf8"),
]);

const homeProjects = staticRegion(homeHtml, "home-projects");
const homeKnowledge = staticRegion(homeHtml, "home-knowledge");
const homeCoaching = staticRegion(homeHtml, "home-coaching");
assertSetEqual(valuesForAttribute(homeProjects, "href"), homeContent.featuredProjects.map((item) => item.href), "Home projects");
assertSetEqual(valuesForAttribute(homeKnowledge, "href"), homeContent.knowledgeAreas.map((item) => item.href), "Home knowledge areas");
assertEqual(valuesForAttribute(homeKnowledge, "href").join("|"), homeContent.knowledgeAreas.map((item) => item.href).join("|"), "Home knowledge area order");
assertEqual((homeCoaching.match(/class=["']status-row["']/g) || []).length, 5, "Home coaching rows");
assertEqual(textById(homeHtml, "wikiDocumentCount"), `${manifest.documentCount}개 기술 문서`, "Home wiki document count");
assertEqual(textById(homeHtml, "currentLearning"), learningState.rotation.next, "Home current learning");
assertEqual(textById(homeHtml, "currentNextAction"), learningState.rotation.after, "Home next action");
if (typeof learningState.recentCompletion !== "string" || !learningState.recentCompletion.trim()) {
  throw new Error("Learning-state recentCompletion must be a non-empty string");
}
for (const value of [
  learningState.coaching.recentEvidence,
  learningState.coaching.diagnosis,
  learningState.coaching.warning,
  learningState.coaching.completionGate,
  learningState.coaching.scheduledRotation,
]) {
  if (!normalizeText(homeCoaching).includes(normalizeText(value))) throw new Error(`Home coaching value is missing: ${value}`);
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
assertEqual(valuesForAttribute(topLevelRoadmapTracks, "data-roadmap-id").join("|"), "ai-ml|coding-test", "Top-level roadmap order");
const aiCurrentMilestone = learningState.journey.milestones.find((item) => item.id === learningState.journey.currentId);
const codingCurrentMilestone = codingTestState.journey.milestones.find((item) => item.id === codingTestState.journey.currentId);
if (!aiCurrentMilestone || !codingCurrentMilestone) throw new Error("Top-level roadmap current milestone is missing");
const codingCompletedCount = codingTestState.journey.milestones.filter((item) => item.status === "complete").length;
const topLevelExpectations = [
  {
    id: "ai-ml",
    href: "pytorch_professional_roadmap.html",
    values: ["AI·ML 통합 로드맵", aiCurrentMilestone.title, learningState.rotation.next, `코어 완료 조건 ${learningState.overall.done} / ${learningState.overall.total}`],
  },
  {
    id: "coding-test",
    href: "wiki/coding-test/index.html",
    values: ["코딩 테스트 역량 로드맵", codingCurrentMilestone.title, codingCurrentMilestone.goal, `성취 관문 ${codingCompletedCount} / ${codingTestState.journey.milestones.length}`],
  },
];
for (const expectation of topLevelExpectations) {
  const card = blockByDataValue(topLevelRoadmapTracks, "data-roadmap-id", expectation.id, "article");
  const cardText = normalizeText(card.html);
  for (const value of expectation.values) {
    if (!cardText.includes(normalizeText(value))) throw new Error(`Top-level roadmap ${expectation.id} is missing: ${value}`);
  }
  if (!valuesForAttribute(card.html, "href").includes(expectation.href)) throw new Error(`Top-level roadmap ${expectation.id} href is stale`);
}
if (/전체\s*(?:진행률|완료율)|통합\s*(?:진행률|완료율)/.test(normalizeText(topLevelRoadmapTracks))) {
  throw new Error("Top-level roadmap must not merge AI and coding-test progress into one percentage");
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
  const phase = track.id === currentTrackId ? "현재 활성" : track.done === track.total ? "완료" : "대기";
  for (const value of [track.title, track.current, track.next, `${phase} · ${percent}% · ${track.done}/${track.total}`]) {
    if (!cardText.includes(normalizeText(value))) throw new Error(`Integrated roadmap track ${track.id} is missing: ${value}`);
  }
  if (!valuesForAttribute(card.html, "href").includes(track.href)) {
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
const recordEntries = [...learningRecords.matchAll(/<article\b([^>]*\bclass=["'][^"']*\bday\b[^"']*["'][^>]*)>\s*<time\b(?=[^>]*\bdatetime=["'](\d{4}-\d{2}-\d{2})["'])[^>]*>/gi)]
  .map((match) => ({ attributes: match[1], date: match[2] }));
const recordedDates = recordEntries.map((entry) => entry.date);
const uniqueRecordedDates = [...new Set(recordedDates)].sort().reverse();
assertEqual(recordedDates.length, uniqueRecordedDates.length, "Unique dated learning records");
assertEqual(recordedDates.join("|"), uniqueRecordedDates.join("|"), "Learning records newest-first order");
for (const entry of recordEntries) {
  const id = entry.attributes.match(/\bid=["']([^"']+)["']/i)?.[1] || "";
  assertEqual(id, `study-${entry.date}`, `Learning-record anchor for ${entry.date}`);
}
assertEqual(textById(historyHtml, "historyLearningDayCount"), `${uniqueRecordedDates.length}일`, "Learning-history day count");
assertEqual(textById(historyHtml, "historyLatestLearningDate"), uniqueRecordedDates[0], "Learning-history latest date");
assertEqual(learningState.updated, uniqueRecordedDates[0], "Learning-state latest date");
function assertJourneyMatches(region, journey, label) {
  const heading = normalizeText(region.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || "");
  const summary = normalizeText(region.match(/<div\b[^>]*class=["'][^"']*journey-heading[^"']*["'][^>]*>[\s\S]*?<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
  assertEqual(heading, journey.title, `${label} title`);
  assertEqual(summary, journey.summary, `${label} summary`);
  if (!normalizeText(region).includes(normalizeText(journey.finalOutcome))) throw new Error(`${label} final outcome is missing`);

  const actualIds = valuesForAttribute(region, "data-milestone-id");
  const expectedIds = journey.milestones.map((milestone) => milestone.id);
  assertEqual(actualIds.join("|"), expectedIds.join("|"), `${label} milestone order`);
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
    assertEqual(valuesForAttribute(block.content, "href").join("|"), milestone.href, `${label} href ${milestone.id}`);
  }
}

if (!historyHtml.includes('assets/js/learning_journey.js')) throw new Error("Learning-journey interaction script is missing");
const learningJourney = staticRegion(historyHtml, "learning-journey");
assertJourneyMatches(learningJourney, learningState.journey, "Learning journey");
const codingTestJourney = staticRegion(historyHtml, "coding-test-journey");
assertJourneyMatches(codingTestJourney, codingTestState.journey, "Coding-test journey");
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
assertEqual(textById(homeHtml, "recentCompletion"), learningState.recentCompletion, "Home recent completion");

console.log(
  `STATIC_FALLBACK_AUDIT=PASS homeProjects=${homeContent.featuredProjects.length} homeKnowledge=${homeContent.knowledgeAreas.length} wikiDocuments=${manifest.indexedCount} mapOccurrences=${expectedOccurrenceIds.length} mapRelations=${expectedRelationPathIds.length} codingProblems=${completedProblemHrefs.length} codingAttemptNotes=${attemptNoteHrefs.length} overall=${learningState.overall.done}/${learningState.overall.total} learningDays=${uniqueRecordedDates.length} studyTime=${textById(historyHtml, "historyRecordedStudyTime")} latest=${uniqueRecordedDates[0]}`,
);
