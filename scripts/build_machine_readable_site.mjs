import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const publicBaseUrl = "https://muscleleg.github.io/jaejun-wiki/";
const metadataStart = "  <!-- machine-readable-metadata:start -->";
const metadataEnd = "  <!-- machine-readable-metadata:end -->";

await import(new URL("./build_knowledge_manifest.mjs", import.meta.url));

const knowledgeManifest = JSON.parse(await readFile(resolve(wikiRoot, "knowledge_manifest.json"), "utf8"));
const conceptGraph = JSON.parse(await readFile(resolve(wikiRoot, "concept_graph.json"), "utf8"));
const knowledgeByHref = new Map(knowledgeManifest.documents.map((document) => [document.href, document]));
const conceptLabelByKey = new Map(conceptGraph.concepts.map((concept) => [concept.conceptKey, concept.labels[0] || concept.conceptKey]));

async function loadWindowValue(sourcePath, property) {
  const context = { window: {} };
  runInNewContext(await readFile(sourcePath, "utf8"), context, { filename: sourcePath });
  const value = context.window[property];
  if (!value) throw new Error(`${property} was not exposed by ${sourcePath}`);
  return value;
}

const homeContent = await loadWindowValue(resolve(wikiRoot, "assets/js/home_content.js"), "HOME_CONTENT");
const learningState = await loadWindowValue(resolve(wikiRoot, "assets/js/learning_state.js"), "LEARNING_STATE");
const codingTestState = await loadWindowValue(resolve(wikiRoot, "assets/js/coding_test_state.js"), "CODING_TEST_STATE");

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    if (entry.name === ".git") return [];
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

function escapeAttribute(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapeHtml(value) {
  return escapeAttribute(String(value));
}

function markerStart(name) {
  return `<!-- static-fallback:${name}:start -->`;
}

function markerEnd(name) {
  return `<!-- static-fallback:${name}:end -->`;
}

function replaceStaticRegion(content, { name, tag, id, markup }) {
  const start = markerStart(name);
  const end = markerEnd(name);
  const block = `${start}\n${markup}\n${end}`;
  if (content.includes(start)) {
    const pattern = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
    return content.replace(pattern, block);
  }
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const emptyContainer = new RegExp(`(<${tag}\\b(?=[^>]*\\bid=["']${escapedId}["'])[^>]*>)\\s*(</${tag}>)`, "i");
  if (!emptyContainer.test(content)) throw new Error(`Empty static fallback container not found: ${id}`);
  return content.replace(emptyContainer, `$1${block}$2`);
}

function replaceElementContent(content, { tag, id, value }) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<${tag}\\b(?=[^>]*\\bid=["']${escapedId}["'])[^>]*>)[\\s\\S]*?(</${tag}>)`, "i");
  if (!pattern.test(content)) throw new Error(`Static text target not found: ${id}`);
  return content.replace(pattern, `$1${escapeHtml(value)}$2`);
}

function sectionById(content, id) {
  const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`<section\\b(?=[^>]*\\bid=["']${escapedId}["'])[^>]*>[\\s\\S]*?<\\/section>`, "i"));
  if (!match) throw new Error(`Section not found: ${id}`);
  return match[0];
}

function normalizeLearningRecordIds(content) {
  const sectionPattern = /(<section\b(?=[^>]*\bid=["']learning-records["'])[^>]*>)([\s\S]*?)(<\/section>)/i;
  const match = content.match(sectionPattern);
  if (!match) throw new Error("Learning-records section not found");
  const seenDates = new Set();
  const articlePattern = /<article\b([^>]*\bclass=["'][^"']*\bday\b[^"']*["'][^>]*)>(\s*)(<time\b(?=[^>]*\bdatetime=["'](\d{4}-\d{2}-\d{2})["'])[^>]*>)/gi;
  const normalizedBody = match[2].replace(articlePattern, (full, attributes, spacing, timeTag, date) => {
    if (seenDates.has(date)) throw new Error(`Duplicate dated learning record: ${date}`);
    seenDates.add(date);
    const expectedId = `study-${date}`;
    const idMatch = attributes.match(/\bid=["']([^"']+)["']/i);
    if (idMatch && idMatch[1] !== expectedId) {
      throw new Error(`Learning-record id mismatch for ${date}: ${idMatch[1]}`);
    }
    const normalizedAttributes = idMatch ? attributes : `${attributes} id="${expectedId}"`;
    return `<article${normalizedAttributes}>${spacing}${timeTag}`;
  });
  if (!seenDates.size) throw new Error("No dated learning records found in learning_history.html");
  return content.replace(sectionPattern, `$1${normalizedBody}$3`);
}

function learningRecordDates(content) {
  const records = sectionById(content, "learning-records");
  const dates = [...records.matchAll(/<article\b(?=[^>]*\bclass=["'][^"']*\bday\b[^"']*["'])[^>]*>\s*<time\b(?=[^>]*\bdatetime=["'](\d{4}-\d{2}-\d{2})["'])[^>]*>/gi)].map((match) => match[1]);
  return [...new Set(dates)].sort().reverse();
}

function parseDurationMinutes(text) {
  const normalized = decodeEntities(text);
  if (normalized === "미기록") return null;
  const hours = normalized.match(/(\d+)시간/);
  const minutes = normalized.match(/(\d+)분/);
  if (!hours && !minutes) throw new Error(`Unsupported study duration: ${normalized}`);
  return {
    minutes: Number(hours?.[1] || 0) * 60 + Number(minutes?.[1] || 0),
    approximate: normalized.startsWith("약 "),
  };
}

function recordedStudyTime(content) {
  const studyTime = sectionById(content, "study-time");
  const durations = [...studyTime.matchAll(/<div\b(?=[^>]*\bclass=["'][^"']*\bduration\b[^"']*["'])[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((match) => parseDurationMinutes(match[1]))
    .filter(Boolean);
  if (!durations.length) return "미기록";
  const totalMinutes = durations.reduce((sum, duration) => sum + duration.minutes, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const value = [hours ? `${hours}시간` : "", minutes ? `${minutes}분` : ""].filter(Boolean).join(" ") || "0분";
  return `${durations.some((duration) => duration.approximate) ? "약 " : ""}${value}`;
}

function renderHomeProjects(projects) {
  return projects.map((project) => {
    const visual = project.image
      ? `<div class="home-project-visual"><img src="${escapeAttribute(project.image)}" alt="${escapeAttribute(project.imageAlt || "")}" loading="lazy"></div>`
      : `<div class="home-project-visual home-project-result"><span>대표 평가 결과</span><strong>${escapeHtml(project.evidence)}</strong><small>${escapeHtml(project.supportingEvidence || "")}</small></div>`;
    return `        <a class="card home-project-card" href="${escapeAttribute(project.href)}">
          ${visual}
          <span class="eyebrow">${escapeHtml(project.eyebrow)}</span>
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description)}</p>
          <strong class="home-project-role">${escapeHtml(project.role)}</strong>
          <div class="home-card-tags">${project.stack.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
          <strong class="home-card-evidence">${escapeHtml(project.evidence)}</strong>
          <small class="home-card-supporting">${escapeHtml(project.supportingEvidence || "")}</small>
        </a>`;
  }).join("\n");
}

function renderKnowledgeAreas(areas) {
  return areas.map((area) => `        <a class="card home-knowledge-card" href="${escapeAttribute(area.href)}">
          <span class="eyebrow">${escapeHtml(area.eyebrow)}</span>
          <h3>${escapeHtml(area.title)}</h3>
          <p>${escapeHtml(area.description)}</p>
        </a>`).join("\n");
}

function renderCoaching(state) {
  const rows = [
    ["현재 학습 상태", state.coaching.recentEvidence],
    ["교육적 판단", state.coaching.diagnosis],
    ["경고 기준", state.coaching.warning],
    ["현재 완료 관문", state.coaching.completionGate],
    ["예약 전환", state.coaching.scheduledRotation],
  ];
  return rows.map(([label, value]) => `            <div class="status-row"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`).join("\n");
}

function renderRoadmaps(tracks) {
  return tracks.map((track) => {
    const percent = Math.round(track.done / track.total * 100);
    return `            <a class="card" href="${escapeAttribute(track.href)}"><span class="tag">${percent}%</span><h3>${escapeHtml(track.title)}</h3><div class="progress"><span style="width:${percent}%"></span></div><div class="meta"><span>${track.done} / ${track.total} 완료</span><span>${percent}%</span></div><p><strong>현재</strong> ${escapeHtml(track.current)}</p><p><strong>다음</strong> ${escapeHtml(track.next)}</p></a>`;
  }).join("\n");
}

function currentJourneyMilestone(journey) {
  const milestone = journey.milestones.find((item) => item.id === journey.currentId);
  if (!milestone) throw new Error(`Journey current milestone not found: ${journey.currentId}`);
  return milestone;
}

function renderRoadmapCard(card) {
  const percent = Math.round(card.done / card.total * 100);
  return `        <article class="card roadmap-track-card" data-roadmap-id="${escapeAttribute(card.id)}">
          <span class="tag">${escapeHtml(card.tag)}</span>
          <h2>${escapeHtml(card.title)}</h2>
          <div class="progress"><span style="width:${percent}%"></span></div>
          <div class="meta"><span>${escapeHtml(card.unit)} ${card.done} / ${card.total}</span><span>${percent}%</span></div>
          <div class="roadmap-track-current"><strong>${escapeHtml(card.currentLabel || "현재 관문")}</strong>${escapeHtml(card.current)}</div>
          <p class="roadmap-track-next"><strong>${escapeHtml(card.nextLabel || "다음 행동")}</strong><br>${escapeHtml(card.next)}</p>
          <a class="button" href="${escapeAttribute(card.href)}">${escapeHtml(card.link)}</a>
        </article>`;
}

function renderPrimaryRoadmapTrack(state) {
  const aiCurrent = currentJourneyMilestone(state.journey);
  return renderRoadmapCard({
    id: "ai-ml",
    tag: state.priorityPolicy.label,
    title: state.priorityPolicy.title,
    done: state.overall.done,
    total: state.overall.total,
    unit: "코어 완료 조건",
    current: aiCurrent.title,
    next: state.rotation.next,
    href: "pytorch_professional_roadmap.html",
    link: "핵심 여정 실행 로드맵 열기",
  });
}

function renderOptionalSessionRoadmap(codingState) {
  const codingCurrent = currentJourneyMilestone(codingState.journey);
  const codingDone = codingState.journey.milestones.filter((item) => item.status === "complete").length;
  return renderRoadmapCard({
    id: "coding-test",
    tag: "사용자 선택 세션",
    title: "코딩 테스트 역량 로드맵",
    done: codingDone,
    total: codingState.journey.milestones.length,
    unit: "성취 관문",
    currentLabel: "선택 시 이어갈 관문",
    current: codingCurrent.title,
    nextLabel: "세션을 선택했을 때의 목표",
    next: codingCurrent.goal,
    href: "wiki/coding-test/index.html",
    link: "코딩 테스트 로드맵 열기",
  });
}

function renderPriorityPolicy(state) {
  return `        <div><strong>${escapeHtml(state.priorityPolicy.label)}</strong>${escapeHtml(state.priorityPolicy.rule)}</div>
        <div><strong>막힘 지원 원칙</strong>${escapeHtml(state.priorityPolicy.supportRule)}</div>
        <div><strong>선택 전 보관 원칙</strong>${escapeHtml(state.priorityPolicy.optionalRule)}</div>`;
}

function renderLearningPriorityNote(state) {
  return `<strong>${escapeHtml(`${state.priorityPolicy.label} · ${state.priorityPolicy.title}`)}</strong>${escapeHtml(state.priorityPolicy.rule)} ${escapeHtml(state.priorityPolicy.supportRule)} ${escapeHtml(state.priorityPolicy.optionalRule)}`;
}

function activeTrackId(state) {
  const currentMilestone = state.journey.milestones.find((milestone) => milestone.id === state.journey.currentId);
  if (!currentMilestone) throw new Error(`Learning journey current milestone not found: ${state.journey.currentId}`);
  const currentHref = currentMilestone.href.split("#")[0];
  return state.tracks.find((track) => track.href.split("#")[0] === currentHref)?.id || null;
}

function renderIntegratedRoadmapProgress(state) {
  const percent = state.overall.total ? state.overall.done / state.overall.total * 100 : 0;
  return `      <div class="progress-track" aria-hidden="true"><div class="progress-fill" id="progressFill" style="width:${percent.toFixed(1)}%"></div></div>
      <div class="progress-label" id="progressLabel">코어 완료 조건 · <span id="roadmapProgressDone">${state.overall.done}</span> / <span id="roadmapProgressTotal">${state.overall.total}</span> 완료</div>`;
}

function renderIntegratedRoadmapTracks(state) {
  const currentTrackId = activeTrackId(state);
  const currentMilestone = currentJourneyMilestone(state.journey);
  return state.tracks.map((track) => {
    const percent = Math.round(track.done / track.total * 100);
    const isCurrent = track.id === currentTrackId;
    const phase = isCurrent ? "현재 활성" : track.done === track.total ? "완료" : "대기";
    const currentText = isCurrent ? currentMilestone.title : track.current;
    const nextText = isCurrent ? currentMilestone.goal : track.next;
    const href = isCurrent ? currentMilestone.href : track.href;
    return `        <article class="hub-card" data-track-id="${escapeAttribute(track.id)}">
          <span class="status${isCurrent ? " learning" : ""}">${phase} · ${percent}% · ${track.done}/${track.total}</span>
          <h3>${escapeHtml(track.title)}</h3>
          <p><strong>${isCurrent ? "현재 관문" : "현재"}:</strong> ${escapeHtml(currentText)}</p>
          <p><strong>${isCurrent ? "현재 관문 목표" : "핵심 여정에서 활성될 때"}:</strong> ${escapeHtml(nextText)}</p>
          <a href="${escapeAttribute(href)}">세부 로드맵 보기 →</a>
        </article>`;
  }).join("\n");
}

function renderIntegratedRoadmapCoaching(state) {
  const rows = [
    ["현재 학습 상태", state.coaching.recentEvidence],
    ["교육적 판단", state.coaching.diagnosis],
    ["경고 기준", state.coaching.warning],
    ["현재 완료 관문", state.coaching.completionGate],
    ["예약 전환", state.coaching.scheduledRotation],
  ];
  return rows.map(([label, value]) => `        <div class="status-line"><span class="status">${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`).join("\n");
}

function renderLearningJourney(journey) {
  if (!journey?.milestones?.length) throw new Error("Learning journey milestones are missing");
  const currentIndex = journey.milestones.findIndex((milestone) => milestone.id === journey.currentId);
  if (currentIndex < 0) throw new Error(`Learning journey current milestone not found: ${journey.currentId}`);
  const progress = journey.milestones.length === 1 ? 100 : (currentIndex / (journey.milestones.length - 1)) * 100;
  const lineInset = 100 / (journey.milestones.length * 2);
  const progressWidth = progress * (100 - lineInset * 2) / 100;
  const steps = journey.milestones.map((milestone, index) => {
    const classes = ["journey-step", `is-${milestone.status}`];
    if (index === journey.milestones.length - 1) classes.push("is-final");
    const marker = milestone.status === "complete" ? "✓" : String(index + 1);
    const currentText = milestone.id === journey.currentId ? ' aria-current="step"' : "";
    return `          <li class="${classes.join(" ")}" data-milestone-id="${escapeAttribute(milestone.id)}"${currentText}>
            <details>
              <summary aria-label="${escapeAttribute(`${milestone.title}: ${milestone.statusLabel}. 성취 목표 보기`)}"><span class="journey-dot" aria-hidden="true">${escapeHtml(marker)}</span><span class="journey-label">${escapeHtml(milestone.shortTitle)}</span></summary>
              <div class="journey-popover">
                <div class="journey-popover-head"><h3>${escapeHtml(milestone.title)}</h3><span class="journey-status">${escapeHtml(milestone.statusLabel)}</span></div>
                <p><strong>성취 목표</strong><br>${escapeHtml(milestone.goal)}</p>
                <p><strong>${milestone.status === "complete" ? "확인된 완료 근거" : "완료 증거"}</strong><br>${escapeHtml(milestone.evidence)}</p>
                <a href="${escapeAttribute(milestone.href)}">관련 로드맵에서 자세히 보기 →</a>
              </div>
            </details>
          </li>`;
  }).join("\n");
  return `        <div class="journey-heading"><div><span class="eyebrow">${escapeHtml(journey.eyebrow)}</span><h2>${escapeHtml(journey.title)}</h2></div><p>${escapeHtml(journey.summary)}</p></div>
        <ol class="journey-track" style="--journey-count:${journey.milestones.length};--journey-inset:${lineInset.toFixed(2)}%;--journey-progress-width:${progressWidth.toFixed(2)}%;--journey-progress-height:${progress.toFixed(2)}%" aria-label="학습 성취 관문">
${steps}
        </ol>
        <p class="journey-final"><strong>최종적으로 할 수 있어야 하는 것</strong><br>${escapeHtml(journey.finalOutcome)}</p>`;
}

function renderDeferredLearningItems(deferredLearningItems, journey) {
  if (!deferredLearningItems?.items?.length) throw new Error("Deferred learning items are missing");
  if (!deferredLearningItems.policy?.types?.length) throw new Error("Deferred learning policy types are missing");
  const milestoneById = new Map(journey.milestones.map((milestone) => [milestone.id, milestone]));
  const typeById = new Map(deferredLearningItems.policy.types.map((type) => [type.id, type]));
  const ids = new Set();
  const items = deferredLearningItems.items.map((item) => {
    if (ids.has(item.id)) throw new Error(`Duplicate deferred learning item: ${item.id}`);
    ids.add(item.id);
    const milestone = milestoneById.get(item.milestoneId);
    if (!milestone) throw new Error(`Deferred learning milestone not found: ${item.milestoneId}`);
    const type = typeById.get(item.type);
    if (!type) throw new Error(`Deferred learning type not found: ${item.type}`);
    return `        <article class="deferred-card" data-deferred-id="${escapeAttribute(item.id)}" data-deferred-status="${escapeAttribute(item.status)}" data-deferred-type="${escapeAttribute(item.type)}">
          <div class="deferred-card-head"><span class="deferred-type">${escapeHtml(type.label)}</span><span class="deferred-status">${escapeHtml(item.statusLabel)}</span><span class="deferred-milestone">${escapeHtml(milestone.shortTitle)}</span></div>
          <h3>${escapeHtml(item.title)}</h3>
          <p><strong>미룬 이유</strong><br>${escapeHtml(item.reason)}</p>
          <p><strong>다시 꺼낼 때</strong><br>${escapeHtml(item.resumeWhen)}</p>
          <p><strong>완료 증거</strong><br>${escapeHtml(item.completion)}</p>
          <a href="${escapeAttribute(item.href)}">관련 로드맵 보기 →</a>
        </article>`;
  }).join("\n");
  const policyTypes = deferredLearningItems.policy.types.map((type) => `            <li><strong>${escapeHtml(type.label)}</strong> · ${escapeHtml(type.activation)}</li>`).join("\n");
  return `        <div class="deferred-policy">
          <p><strong>검토 시점</strong><br>${escapeHtml(deferredLearningItems.policy.reviewWhen)}</p>
          <p><strong>활성 제한</strong><br>한 번에 최대 ${escapeHtml(deferredLearningItems.policy.activeLimit)}개만 꺼내고, 반복 약점은 같은 막힘이 ${escapeHtml(deferredLearningItems.policy.repeatThreshold)}회 확인될 때 활성화합니다.</p>
          <ul>
${policyTypes}
          </ul>
        </div>
        <div class="deferred-grid">
${items}
        </div>`;
}

function hierarchyFor(entry, documentByHref, cache) {
  if (cache.has(entry.href)) return cache.get(entry.href);
  const chain = [];
  const seen = new Set();
  let current = entry;
  while (current && !seen.has(current.href)) {
    chain.unshift(current);
    seen.add(current.href);
    current = current.parentHref ? documentByHref.get(current.parentHref) : null;
  }
  cache.set(entry.href, chain);
  return chain;
}

function renderWikiTree(manifest) {
  const documentByHref = new Map(manifest.documents.map((entry) => [entry.href, entry]));
  const hierarchyCache = new Map();
  const hierarchy = (entry) => hierarchyFor(entry, documentByHref, hierarchyCache);
  const entries = [...manifest.documents].sort((left, right) => {
    const leftPath = hierarchy(left);
    const rightPath = hierarchy(right);
    for (let index = 0; index < Math.max(leftPath.length, rightPath.length); index += 1) {
      if (!leftPath[index]) return -1;
      if (!rightPath[index]) return 1;
      const compared = leftPath[index].title.localeCompare(rightPath[index].title, "ko");
      if (compared) return compared;
    }
    return 0;
  });
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.categoryKey)) groups.set(entry.categoryKey, { label: entry.category, entries: [] });
    groups.get(entry.categoryKey).entries.push(entry);
  }
  const categoryOrder = new Map(manifest.categories.map((item, index) => [item.id, index]));
  return [...groups.entries()]
    .sort(([leftKey, left], [rightKey, right]) => {
      const order = (categoryOrder.get(leftKey) ?? 999) - (categoryOrder.get(rightKey) ?? 999);
      return order || left.label.localeCompare(right.label, "ko");
    })
    .map(([groupKey, group]) => {
      const renderLink = (entry) => {
        const path = hierarchy(entry);
        const parent = path.at(-2);
        const depth = Math.max(0, path.filter((item) => item.categoryKey === groupKey).length - 1);
        const childClass = depth > 0 ? " wiki-search-child" : "";
        const meta = parent ? `${entry.category} · ${parent.title}의 하위 문서` : `${entry.category} · 상위 문서`;
        return `          <a class="wiki-link wiki-search-result${childClass}" style="--wiki-depth:${Math.min(depth, 4)}" data-depth="${depth}" href="${escapeAttribute(entry.href)}"><em>${escapeHtml(meta)}</em><strong>${escapeHtml(entry.title)}</strong><span>${escapeHtml(entry.description || "연결된 학습 문서")}</span></a>`;
      };
      const rootGroups = [];
      for (const entry of group.entries) {
        const depth = Math.max(0, hierarchy(entry).filter((item) => item.categoryKey === groupKey).length - 1);
        if (!rootGroups.length || depth === 0) rootGroups.push({ root: entry, descendants: [] });
        else rootGroups.at(-1).descendants.push(entry);
      }
      const roots = rootGroups.map(({ root, descendants }) => {
        if (!descendants.length) return `        <div class="wiki-tree-root"><div class="wiki-tree-root-row">\n${renderLink(root)}\n          </div></div>`;
        const childId = `wiki-children-${root.id}`;
        const children = descendants.map(renderLink).join("\n");
        return `        <div class="wiki-tree-root"><div class="wiki-tree-root-row">\n${renderLink(root)}\n          <button type="button" class="wiki-tree-toggle" data-root-key="${escapeAttribute(root.href)}" data-child-count="${descendants.length}" aria-expanded="false" aria-controls="${escapeAttribute(childId)}">하위 문서 ${descendants.length}개 펼치기</button>\n          </div><div id="${escapeAttribute(childId)}" class="wiki-tree-children" hidden>\n${children}\n          </div></div>`;
      }).join("\n");
      return `      <section id="wiki-category-${escapeAttribute(groupKey)}" class="wiki-tree-category" data-category="${escapeAttribute(groupKey)}"><h3>${escapeHtml(group.label)}<span>${group.entries.length}개</span></h3><div class="wiki-tree-list">\n${roots}\n        </div></section>`;
    }).join("\n");
}

function countWikiRoots(manifest) {
  const documentByHref = new Map(manifest.documents.map((entry) => [entry.href, entry]));
  const hierarchyCache = new Map();
  return manifest.documents.filter((entry) => (
    hierarchyFor(entry, documentByHref, hierarchyCache)
      .filter((item) => item.categoryKey === entry.categoryKey).length === 1
  )).length;
}

function renderWikiFilters(manifest) {
  return [{ id: "all", label: "전체" }, ...manifest.categories]
    .map(({ id, label }) => `      <button type="button" data-category="${escapeAttribute(id)}" aria-pressed="${id === "all"}">${escapeHtml(label)}</button>`)
    .join("\n");
}

function renderStaticMindmap(graph) {
  const view = graph.views[0];
  if (!view) throw new Error("concept_graph.json has no default view");
  const occurrenceById = new Map(graph.occurrences.map((occurrence) => [occurrence.id, occurrence]));
  const childrenById = new Map();
  for (const edge of graph.edges.filter((edge) => edge.viewId === view.id)) {
    const children = childrenById.get(edge.source) || [];
    children.push(edge.target);
    childrenById.set(edge.source, children);
  }
  const counts = new Map();
  for (const occurrence of graph.occurrences.filter((occurrence) => occurrence.viewId === view.id)) {
    counts.set(occurrence.conceptKey, (counts.get(occurrence.conceptKey) || 0) + 1);
  }
  function renderOccurrence(id, depth = 0) {
    const occurrence = occurrenceById.get(id);
    if (!occurrence) throw new Error(`Missing concept occurrence: ${id}`);
    const childIds = childrenById.get(id) || [];
    const duplicateCount = counts.get(occurrence.conceptKey) || 1;
    const duplicateClass = duplicateCount > 1 ? " duplicate" : "";
    const toggleClass = childIds.length ? "" : " placeholder";
    const documentLink = occurrence.href
      ? `<a class="map-document-link" href="${escapeAttribute(occurrence.href)}" aria-label="${escapeAttribute(`${occurrence.label} 문서 열기`)}">문서 ↗</a>`
      : "";
    const children = childIds.length
      ? `<ul class="map-children">${childIds.map((childId) => renderOccurrence(childId, depth + 1)).join("")}</ul>`
      : "";
    const statusLabel = ({ verified: "검증 완료", learning: "학습 중", reference: "연결 참조" })[occurrence.status] || "상태 미지정";
    return `<li data-occurrence-id="${escapeAttribute(id)}"><div class="map-node-row"><button type="button" class="map-toggle${toggleClass}" aria-label="${escapeAttribute(`${occurrence.label} 하위 개념`)}" aria-expanded="true">${childIds.length ? "−" : "+"}</button><button type="button" class="map-concept${duplicateClass}" data-concept="${escapeAttribute(occurrence.conceptKey)}" aria-label="${escapeAttribute(`${occurrence.label}, ${statusLabel}`)}"><span class="map-node-status ${escapeAttribute(occurrence.status || "")}" aria-hidden="true"></span><span class="map-node-label">${escapeHtml(occurrence.label)}</span>${duplicateCount > 1 ? `<span class="map-duplicate-count">×${duplicateCount}</span>` : ""}</button>${documentLink}</div>${children}</li>`;
  }
  return {
    view,
    tree: `          ${renderOccurrence(view.rootOccurrenceId)}`,
    tabs: graph.views.map((item, index) => `        <button type="button" data-view="${escapeAttribute(item.id)}" aria-pressed="${index === 0}">${escapeHtml(item.label)}</button>`).join("\n"),
  };
}

function renderStaticRelationPaths(graph) {
  const occurrenceById = new Map(graph.occurrences.map((occurrence) => [occurrence.id, occurrence]));
  return graph.views.map((view) => {
    const childrenById = new Map();
    for (const edge of graph.edges.filter((edge) => edge.viewId === view.id)) {
      const children = childrenById.get(edge.source) || [];
      children.push(edge.target);
      childrenById.set(edge.source, children);
    }
    const paths = [];
    function visit(id, path, seen) {
      if (seen.has(id)) throw new Error(`Cycle found in concept view ${view.id}: ${id}`);
      const occurrence = occurrenceById.get(id);
      if (!occurrence) throw new Error(`Missing concept occurrence: ${id}`);
      const nextPath = [...path, occurrence];
      const children = childrenById.get(id) || [];
      if (!children.length) {
        paths.push(nextPath);
        return;
      }
      const nextSeen = new Set(seen).add(id);
      for (const childId of children) visit(childId, nextPath, nextSeen);
    }
    visit(view.rootOccurrenceId, [], new Set());
    const items = paths.map((path, index) => {
      const nodes = path.map((occurrence) => occurrence.href
        ? `<a href="${escapeAttribute(occurrence.href)}">${escapeHtml(occurrence.label)}</a>`
        : `<span>${escapeHtml(occurrence.label)}</span>`);
      return `            <li data-relation-path="${escapeAttribute(`${view.id}:${index + 1}`)}">${nodes.join('<span class="map-relation-arrow" aria-hidden="true">→</span>')}</li>`;
    }).join("\n");
    return `        <section class="map-relation-view" data-view="${escapeAttribute(view.id)}"><h3>${escapeHtml(view.label)}</h3><p>${escapeHtml(view.description)}</p><ul class="map-relation-paths">\n${items}\n          </ul></section>`;
  }).join("\n");
}

async function renderStaticDiscoveryPages() {
  const homePath = resolve(wikiRoot, "index.html");
  let home = await readFile(homePath, "utf8");
  for (const [tag, id, value] of [
    ["strong", "wikiDocumentCount", `${knowledgeManifest.documentCount}개 기술 문서`],
    ["strong", "recentCompletion", learningState.recentCompletion],
    ["strong", "currentLearning", learningState.rotation.next],
    ["strong", "currentNextAction", learningState.rotation.after],
  ]) home = replaceElementContent(home, { tag, id, value });
  home = replaceStaticRegion(home, { name: "home-projects", tag: "div", id: "featuredProjectGrid", markup: renderHomeProjects(homeContent.featuredProjects) });
  home = replaceStaticRegion(home, { name: "home-knowledge", tag: "div", id: "knowledgeAreaGrid", markup: renderKnowledgeAreas(homeContent.knowledgeAreas) });
  home = replaceStaticRegion(home, { name: "home-coaching", tag: "div", id: "coachingStatus", markup: renderCoaching(learningState) });
  await writeFile(homePath, home, "utf8");

  const topLevelRoadmapPath = resolve(wikiRoot, "roadmap.html");
  let topLevelRoadmap = await readFile(topLevelRoadmapPath, "utf8");
  topLevelRoadmap = replaceStaticRegion(topLevelRoadmap, {
    name: "top-level-roadmap-tracks",
    tag: "div",
    id: "topLevelRoadmapTracks",
    markup: renderPrimaryRoadmapTrack(learningState),
  });
  topLevelRoadmap = replaceStaticRegion(topLevelRoadmap, {
    name: "optional-session-roadmaps",
    tag: "div",
    id: "optionalSessionRoadmapTracks",
    markup: renderOptionalSessionRoadmap(codingTestState),
  });
  topLevelRoadmap = replaceStaticRegion(topLevelRoadmap, {
    name: "primary-journey-policy",
    tag: "div",
    id: "primaryJourneyPolicy",
    markup: renderPriorityPolicy(learningState),
  });
  await writeFile(topLevelRoadmapPath, topLevelRoadmap, "utf8");

  const wikiPath = resolve(wikiRoot, "wiki.html");
  let wiki = await readFile(wikiPath, "utf8");
  wiki = replaceStaticRegion(wiki, { name: "wiki-filters", tag: "div", id: "wikiCategoryFilters", markup: renderWikiFilters(knowledgeManifest) });
  wiki = replaceStaticRegion(wiki, { name: "wiki-status", tag: "p", id: "wikiSearchStatus", markup: `전체 ${knowledgeManifest.indexedCount}개 문서 중 최상위 ${countWikiRoots(knowledgeManifest)}개를 표시합니다. 하위 문서는 문서별 펼치기 버튼으로 확인할 수 있습니다.` });
  wiki = replaceStaticRegion(wiki, { name: "wiki-tree", tag: "div", id: "wikiSearchResults", markup: renderWikiTree(knowledgeManifest) });
  await writeFile(wikiPath, wiki, "utf8");

  const mapPath = resolve(wikiRoot, "knowledge_map.html");
  let map = await readFile(mapPath, "utf8");
  const mindmap = renderStaticMindmap(conceptGraph);
  map = replaceElementContent(map, { tag: "strong", id: "mapDocumentCount", value: `${knowledgeManifest.documentCount}개` });
  map = replaceElementContent(map, { tag: "p", id: "mapDescription", value: mindmap.view.description });
  map = replaceStaticRegion(map, { name: "map-tabs", tag: "div", id: "mapViewTabs", markup: mindmap.tabs });
  map = replaceStaticRegion(map, { name: "map-tree", tag: "ul", id: "mindmapTree", markup: mindmap.tree });
  map = replaceStaticRegion(map, { name: "map-relations", tag: "div", id: "mapRelationList", markup: renderStaticRelationPaths(conceptGraph) });
  await writeFile(mapPath, map, "utf8");

  const historyPath = resolve(wikiRoot, "learning_history.html");
  let history = await readFile(historyPath, "utf8");
  history = normalizeLearningRecordIds(history);
  const uniqueStudyDates = learningRecordDates(history);
  if (!uniqueStudyDates.length) throw new Error("No dated learning records found in learning_history.html");
  history = replaceElementContent(history, { tag: "strong", id: "historyLearningDayCount", value: `${uniqueStudyDates.length}일` });
  history = replaceElementContent(history, { tag: "strong", id: "historyRecordedStudyTime", value: recordedStudyTime(history) });
  history = replaceElementContent(history, { tag: "strong", id: "historyLatestLearningDate", value: uniqueStudyDates[0] });
  history = replaceStaticRegion(history, { name: "learning-priority-policy", tag: "div", id: "learningPriorityPolicy", markup: renderLearningPriorityNote(learningState) });
  history = replaceStaticRegion(history, { name: "learning-journey", tag: "div", id: "learningJourney", markup: renderLearningJourney(learningState.journey) });
  history = replaceStaticRegion(history, { name: "deferred-learning-items", tag: "div", id: "deferredLearningItems", markup: renderDeferredLearningItems(learningState.deferredLearningItems, learningState.journey) });
  history = replaceStaticRegion(history, { name: "coding-test-journey", tag: "div", id: "codingTestJourney", markup: renderLearningJourney(codingTestState.journey) });
  await writeFile(historyPath, history, "utf8");

  const roadmapPath = resolve(wikiRoot, "pytorch_professional_roadmap.html");
  let roadmap = await readFile(roadmapPath, "utf8");
  roadmap = replaceStaticRegion(roadmap, { name: "roadmap-progress", tag: "div", id: "roadmapProgress", markup: renderIntegratedRoadmapProgress(learningState) });
  roadmap = replaceStaticRegion(roadmap, { name: "roadmap-tracks", tag: "div", id: "integratedRoadmapTracks", markup: renderIntegratedRoadmapTracks(learningState) });
  roadmap = replaceStaticRegion(roadmap, { name: "roadmap-coaching", tag: "div", id: "coachingStatus", markup: renderIntegratedRoadmapCoaching(learningState) });
  roadmap = replaceElementContent(roadmap, { tag: "span", id: "roadmapOverallTotal", value: learningState.overall.total });
  roadmap = replaceElementContent(roadmap, { tag: "span", id: "roadmapOverallDone", value: learningState.overall.done });
  await writeFile(roadmapPath, roadmap, "utf8");
}

function relativeRootPrefix(href) {
  const depth = href.split("/").length - 1;
  return "../".repeat(depth);
}

function publicUrlForHref(href) {
  return href === "index.html" ? publicBaseUrl : new URL(href, publicBaseUrl).href;
}

function classifyPage(href) {
  if (href === "index.html") return "WebSite";
  if (href.startsWith("wiki/") && !href.endsWith("/index.html")) return "TechArticle";
  if (href.startsWith("roadmaps/") || ["roadmap.html", "pytorch_professional_roadmap.html", "wiki/coding-test/index.html"].includes(href)) return "LearningResource";
  return "CollectionPage";
}

function inferParentHref(href, knowledgeDocument) {
  if (href === "wiki/coding-test/index.html") return "roadmap.html";
  if (knowledgeDocument?.parentHref) return knowledgeDocument.parentHref;
  if (href.endsWith("/index.html") && href.startsWith("wiki/")) return "wiki.html";
  if ([
    "roadmaps/roadmap_cs_systems.html",
    "roadmaps/roadmap_data_engineering.html",
    "roadmaps/roadmap_database_systems.html",
    "roadmaps/roadmap_kubernetes.html",
    "roadmaps/roadmap_linux_systems.html",
    "roadmaps/roadmap_network_systems.html",
    "roadmaps/roadmap_openstack.html",
  ].includes(href)) return "roadmap.html";
  if (href.startsWith("roadmaps/")) return "pytorch_professional_roadmap.html";
  if (href === "pytorch_professional_roadmap.html") return "roadmap.html";
  if (["wiki.html", "learning_history.html", "roadmap.html"].includes(href)) return "index.html";
  if (href === "knowledge_map.html") return "wiki.html";
  return null;
}

function extractBreadcrumbs(content, href, title) {
  const block = content.match(/<nav[^>]*class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/nav>/i)?.[1] || "";
  const items = [];
  for (const match of block.matchAll(/<(a|span)([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const label = decodeEntities(match[3]);
    if (!label || label === "›") continue;
    const link = match[2].match(/href=["']([^"']+)["']/i)?.[1] || null;
    const absoluteHref = link ? new URL(link, new URL(href, publicBaseUrl)).href : null;
    items.push({
      name: label.replace(/^⌂\s*/, ""),
      href: absoluteHref === `${publicBaseUrl}index.html` ? publicBaseUrl : absoluteHref,
    });
  }
  if (!items.length) items.push({ name: title, href: publicUrlForHref(href) });
  return items;
}

function buildJsonLd(page) {
  const pageId = `${page.url}#page`;
  const websiteId = `${publicBaseUrl}#website`;
  const pageEntity = {
    "@type": page.documentType,
    "@id": page.documentType === "WebSite" ? websiteId : pageId,
    url: page.url,
    name: page.title,
    description: page.description,
    inLanguage: "ko",
  };

  if (page.documentType !== "WebSite") {
    pageEntity.isPartOf = { "@id": websiteId };
    pageEntity.mainEntityOfPage = { "@id": page.url };
  }
  if (page.documentType === "TechArticle") pageEntity.headline = page.title;
  if (page.documentType === "LearningResource") pageEntity.learningResourceType = "Roadmap";
  if (page.conceptKeys.length) {
    pageEntity.about = page.conceptKeys.map((conceptKey) => ({
      "@type": "Thing",
      "@id": `${publicBaseUrl}concept_graph.json#${conceptKey}`,
      name: conceptLabelByKey.get(conceptKey) || conceptKey,
      identifier: conceptKey,
    }));
  }

  const graph = [pageEntity];
  if (page.documentType !== "WebSite") {
    graph.push({
      "@type": "WebSite",
      "@id": websiteId,
      url: publicBaseUrl,
      name: "공부의 흐름을 기록하는 기술 위키",
      inLanguage: "ko",
    });
  }
  if (page.breadcrumbs.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${page.url}#breadcrumb`,
      itemListElement: page.breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        ...(item.href ? { item: item.href } : {}),
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

function buildMetadataBlock(page) {
  const rootPrefix = relativeRootPrefix(page.href);
  const jsonLd = JSON.stringify(buildJsonLd(page)).replaceAll("<", "\\u003c");
  const lines = [metadataStart];
  if (!page.hasDescription) lines.push(`  <meta name="description" content="${escapeAttribute(page.description)}">`);
  lines.push(
    `  <link rel="canonical" href="${escapeAttribute(page.url)}">`,
    `  <link rel="alternate" type="application/json" href="${rootPrefix}site_manifest.json" title="사이트 문서 색인">`,
    `  <link rel="alternate" type="application/json" href="${rootPrefix}knowledge_manifest.json" title="기술 위키 문서 색인">`,
    `  <link rel="alternate" type="application/json" href="${rootPrefix}concept_graph.json" title="지식 개념 그래프">`,
    `  <link rel="alternate" type="text/plain" href="${rootPrefix}llms.txt" title="LLM용 사이트 안내">`,
    `  <meta property="og:type" content="${page.documentType === "TechArticle" ? "article" : "website"}">`,
    `  <meta property="og:locale" content="ko_KR">`,
    `  <meta property="og:title" content="${escapeAttribute(page.title)}">`,
    `  <meta property="og:description" content="${escapeAttribute(page.description)}">`,
    `  <meta property="og:url" content="${escapeAttribute(page.url)}">`,
    "  <script type=\"application/ld+json\">",
    `  ${jsonLd}`,
    "  </script>",
    metadataEnd,
  );
  return lines.join("\n");
}

function removeMetadataBlock(content) {
  const existing = new RegExp(`${metadataStart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${metadataEnd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "g");
  return content.replace(existing, "");
}

function replaceMetadataBlock(content, block) {
  const withoutExisting = removeMetadataBlock(content);
  return withoutExisting.replace(/\n?<\/head>/i, `\n${block}\n</head>`);
}

await renderStaticDiscoveryPages();

const htmlFiles = (await collectHtmlFiles(wikiRoot)).sort();
const pages = [];

for (const file of htmlFiles) {
  const href = relative(wikiRoot, file).replaceAll("\\", "/");
  const content = await readFile(file, "utf8");
  const authoredContent = removeMetadataBlock(content);
  const knowledgeDocument = knowledgeByHref.get(href);
  const title = extract(authoredContent, /<title[^>]*>([\s\S]*?)<\/title>/i)
    || extract(authoredContent, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
    || href;
  const explicitDescription = extract(authoredContent, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const description = explicitDescription
    || extract(authoredContent, /<p[^>]*class=["'][^"']*(?:summary|lead|intro)[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)
    || knowledgeDocument?.description
    || title;
  const page = {
    id: href.replace(/\.html$/, "").replaceAll("/", "-"),
    href,
    url: publicUrlForHref(href),
    title,
    description,
    documentType: classifyPage(href),
    language: "ko",
    parentHref: inferParentHref(href, knowledgeDocument),
    breadcrumbs: extractBreadcrumbs(authoredContent, href, title),
    conceptKeys: knowledgeDocument?.conceptKeys || [],
    hasDescription: Boolean(explicitDescription),
  };
  pages.push(page);
  const updated = replaceMetadataBlock(content, buildMetadataBlock(page));
  if (updated !== content) await writeFile(file, updated, "utf8");
}

const siteManifest = {
  schemaVersion: 1,
  site: publicBaseUrl,
  language: "ko",
  pageCount: pages.length,
  rendering: {
    coreDiscovery: "pre-rendered-html",
    javascriptRole: "progressive-enhancement-for-search-filters-and-view-switching",
    conceptRelations: "static-root-to-leaf-paths-for-every-view",
  },
  resources: {
    sitemap: `${publicBaseUrl}sitemap.xml`,
    llms: `${publicBaseUrl}llms.txt`,
    knowledgeManifest: `${publicBaseUrl}knowledge_manifest.json`,
    conceptGraph: `${publicBaseUrl}concept_graph.json`,
  },
  pages: pages.map(({ hasDescription, ...page }) => page),
};
await writeFile(resolve(wikiRoot, "site_manifest.json"), `${JSON.stringify(siteManifest, null, 2)}\n`, "utf8");

const sitemap = [
  "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
  "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
  ...pages.map((page) => `  <url><loc>${escapeXml(page.url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");
await writeFile(resolve(wikiRoot, "sitemap.xml"), sitemap, "utf8");

const llmsText = `# 공부의 흐름을 기록하는 기술 위키

> 프로젝트, Machine Learning, PyTorch, Transformer, 수학과 LLM 시스템을 직접 구현하고 검증하며 남긴 한국어 기술 위키입니다.

## 주요 진입점

- [홈](${publicBaseUrl})
- [기술 위키 전체 문서](${publicBaseUrl}wiki.html)
- [지식 지도](${publicBaseUrl}knowledge_map.html)
- [전체 학습 로드맵](${publicBaseUrl}roadmap.html)
- [AI·ML 통합 로드맵](${publicBaseUrl}pytorch_professional_roadmap.html)
- [코딩 테스트 역량 로드맵](${publicBaseUrl}wiki/coding-test/index.html)
- [학습 기록](${publicBaseUrl}learning_history.html)

## 기계 판독용 색인

- [전체 사이트 문서 색인](${publicBaseUrl}site_manifest.json): 공개 HTML 페이지의 제목, 설명, 유형, 상위 문서와 breadcrumb
- [기술 위키 문서 색인](${publicBaseUrl}knowledge_manifest.json): 기술 문서의 카테고리, 부모 관계, 검색 텍스트와 conceptKey
- [개념 그래프](${publicBaseUrl}concept_graph.json): 같은 개념의 중복 배치, 관점별 경로와 문서 연결
- [사이트맵](${publicBaseUrl}sitemap.xml): 공개 HTML의 canonical URL 목록

## 읽는 방법

- 개별 문서는 정적 HTML 본문을 기준으로 읽습니다.
- 홈의 프로젝트·기술 문서, 기술 위키의 전체 문서 계층, 지식 지도의 기본 관점은 HTML에 미리 렌더링되어 있습니다. 지식 지도 아래에는 모든 관점의 루트→말단 관계가 정적 텍스트 경로로도 제공되며, JavaScript는 검색·필터·관점 전환을 보강합니다.
- 문서 계층은 기술 위키 색인의 parentHref와 breadcrumbs를 따릅니다.
- 지식 지도에서 같은 conceptKey가 여러 번 나오는 것은 오류가 아니라 서로 다른 관점에서 같은 개념을 찾기 위한 의도적인 중복입니다.
- 학습 완료 여부는 문서 존재가 아니라 로드맵과 검증 기록을 기준으로 해석합니다.
`;
await writeFile(resolve(wikiRoot, "llms.txt"), llmsText, "utf8");

console.log(`MACHINE_READABLE_SITE_BUILD=PASS pages=${pages.length} descriptions=${pages.length} canonical=${pages.length} jsonLd=${pages.length}`);
