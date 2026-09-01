import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const projectName = "개인화 학습 코치 위키";
const projectHref = "wiki/projects/adaptive-learning-coach.html";
const projectUrl = `https://muscleleg.github.io/jaejun-wiki/${projectHref}`;
const projectConceptKey = "adaptive-learning-coach-project";
const imageRoot = "assets/images/projects/adaptive-learning-coach";
const findings = [];

async function source(path) {
  return readFile(resolve(wikiRoot, path), "utf8");
}

function requireText(content, expected, location) {
  if (!content.includes(expected)) findings.push(`${location}: ${JSON.stringify(expected)} 누락`);
}

function rejectText(content, forbidden, location) {
  if (content.includes(forbidden)) findings.push(`${location}: 공개 금지 또는 이전 표기 ${JSON.stringify(forbidden)} 발견`);
}

function requireOrdered(content, expectedItems, location) {
  let previousIndex = -1;
  for (const item of expectedItems) {
    const index = content.indexOf(item);
    if (index === -1) {
      findings.push(`${location}: ${JSON.stringify(item)} 누락`);
    } else if (index <= previousIndex) {
      findings.push(`${location}: ${JSON.stringify(item)} 순서 불일치`);
    }
    previousIndex = Math.max(previousIndex, index);
  }
}

function fragment(content, startToken, endToken, location) {
  const start = content.indexOf(startToken);
  const end = start === -1 ? -1 : content.indexOf(endToken, start);
  if (start === -1 || end === -1) {
    findings.push(`${location}: 구간 경계를 찾을 수 없음`);
    return "";
  }
  return content.slice(start, end + endToken.length);
}

async function requireAsset(path) {
  try {
    const result = await stat(resolve(wikiRoot, path));
    if (!result.isFile() || result.size === 0) findings.push(`${path}: 비어 있거나 파일이 아님`);
  } catch {
    findings.push(`${path}: 시각 자산 누락`);
  }
}

const [
  catalogSource,
  mapSource,
  projectSource,
  wikiSource,
  homeHtml,
  mapHtml,
  siteManifestSource,
  knowledgeManifestSource,
  conceptGraphSource,
  sitemapSource,
  projectCss,
  featuredSvg,
  reviewStateSource,
  learningHistoryDataSource,
  learningHistorySource,
  learningBacklogSource,
  learningReviewSource,
  reviewCss,
  reviewJs,
  reviewRecordScript,
] = await Promise.all([
  source("assets/data/content_catalog.json"),
  source("assets/js/knowledge_map.js"),
  source(projectHref),
  source("wiki.html"),
  source("index.html"),
  source("knowledge_map.html"),
  source("site_manifest.json"),
  source("knowledge_manifest.json"),
  source("concept_graph.json"),
  source("sitemap.xml"),
  source("assets/css/wiki-reference.css"),
  source(`${imageRoot}/personal-learning-loop-featured.svg`),
  source("assets/data/review_state.json"),
  source("assets/data/learning_history.json"),
  source("learning_history.html"),
  source("learning_backlog.html"),
  source("learning_review.html"),
  source("assets/css/review-queue.css"),
  source("assets/js/review_queue.js"),
  source("scripts/record_review_result.mjs"),
]);

for (const [location, content] of [
  ["content_catalog.json", catalogSource],
  ["knowledge_map.js", mapSource],
  [projectHref, projectSource],
  ["wiki.html", wikiSource],
  ["index.html", homeHtml],
  ["knowledge_map.html", mapHtml],
]) {
  requireText(content, projectName, location);
  requireText(content, projectHref, location);
}

const catalog = JSON.parse(catalogSource);
const catalogProject = catalog.items.find(({ href }) => href === projectHref);
if (!catalogProject) {
  findings.push("content_catalog.json: 개인화 학습 코치 프로젝트 항목 누락");
} else {
  const catalogProjectSource = JSON.stringify(catalogProject);
  for (const token of ["코딩 에이전트", "로드맵과 학습 기록", "현재 관문", "실제 학습 근거", "다음 행동", "보류 목록"]) {
    requireText(catalogProjectSource, token, "content_catalog.json 프로젝트 카드");
  }
  if (catalogProject.thumbnail?.src !== `${imageRoot}/personal-learning-loop-featured.svg`) {
    findings.push("content_catalog.json: 개인화 학습 코치 대표 썸네일 경로 불일치");
  }
}
requireText(homeHtml, 'id="homeLearningJourney"', "index.html Road 학습 여정");
requireOrdered(homeHtml, ['id="homeLearningJourney"', 'id="projects"'], "index.html Road 학습 여정과 프로젝트 순서");

const standardAnchors = ["overview", "background", "goals", "features", "service-flow", "system-architecture", "data-design", "ownership", "validation"];
const standardHeadings = ["개발 배경", "핵심 목표", "주요 기능", "학습이 이어지는 과정", "자동화의 역할과 경계", "학습 기록을 신뢰할 수 있는 이유"];
const legacyAnchors = ["problem", "learning-loop", "learning-memory", "learning-backlog", "memory-reinforcement", "adaptive-coaching", "ownership", "document-discovery", "knowledge-map", "static-build", "validation", "status-limits"];

for (const anchor of standardAnchors) requireText(projectSource, `id="${anchor}"`, `${projectHref} 표준 구간`);
for (const anchor of legacyAnchors) requireText(projectSource, `id="${anchor}"`, `${projectHref} 기존 링크 호환 구간`);
for (const heading of standardHeadings) requireText(projectSource, `>${heading}</h`, `${projectHref} 독자 중심 목차`);
requireOrdered(projectSource, standardHeadings.map((heading) => `>${heading}</h`), `${projectHref} 독자 중심 목차`);
requireText(projectSource, '<body class="wiki-reference audience-first-project adaptive-learning-project" data-document-toc="off">', `${projectHref} 공통·전용 body hook과 이동형 목차 비활성화`);
requireText(projectSource, '<meta name="description" content="Codex와 같은 코딩 에이전트가 로드맵·학습 기록·간격 회상 결과를 함께 읽고 다음 학습과 장기기억 유지를 돕는 저장소 기반 학습 자동화 하네스">', `${projectHref} 구현 정체성을 밝힌 meta description`);

rejectText(projectSource, '<section id="overview">', `${projectHref} 상단과 중복되는 별도 프로젝트 개요`);
const overviewSection = fragment(projectSource, '<header id="overview" class="hero">', "</header>", `${projectHref} 상단 프로젝트 개요`);
for (const token of ["Codex와 같은 코딩 에이전트", "저장소 기반 학습 자동화 하네스", "로드맵은 최종 목표·현재 관문·완료 조건·다음 순서를 기억", "학습 기록은 실제로 공부한 내용·확인한 이해·막힌 지점을 남깁니다", "둘을 함께 읽어 지금 할 한 단계", "독립적인 기억 강화 세션", "장기기억 유지 여부", "코딩 에이전트가 저장소를 읽고 수정", "별도의 백엔드 서비스", "HTML·CSS·JavaScript", "Git"]) {
  requireText(overviewSection, token, `${projectHref} 프로젝트 개요의 구현 정체성`);
}
rejectText(projectSource, "Node.js", `${projectHref} 프로젝트 정체성과 무관한 내부 구현 도구 노출`);

const featureIds = ["learning-memory", "memory-reinforcement", "adaptive-coaching", "document-discovery"];
const featureNames = ["자동 학습 기록과 보류 목록", "기억 강화 세션", "로드맵·학습 기록 기반 코칭", "체계적인 문서 축적과 빠른 탐색"];
const featuresSection = fragment(projectSource, '<section id="features">', "</section>", `${projectHref} 주요 기능`);
requireText(featuresSection, 'class="feature-directory"', `${projectHref} 평면 기능 목차`);
rejectText(featuresSection, 'class="feature-index"', `${projectHref} 스크롤 이동형 기능 목차`);
rejectText(featuresSection, 'class="feature-accordion"', `${projectHref} 게시물형 기능 목록`);
rejectText(featuresSection, 'class="feature-disclosure"', `${projectHref} 기능 전체 접기`);
rejectText(featuresSection, 'class="feature-story', `${projectHref} 목차 안의 중첩 기능 상세`);
rejectText(projectSource, '<nav aria-label="문서 목차">', `${projectHref} 스크롤 이동형 문서 목차`);
for (let index = 0; index < featureIds.length; index += 1) {
  const id = featureIds[index];
  const name = featureNames[index];
  const story = fragment(projectSource, `<article id="${id}" class="feature-story feature-section">`, "</article>", `${projectHref} ${name}`);
  requireText(featuresSection, `<strong>${name}</strong>`, `${projectHref} 기능 목차 ${name}`);
  requireText(story, `<header><span class="feature-number">기능 0${index + 1}</span><h2>${name}</h2></header>`, `${projectHref} ${name} 독립 상세 제목`);
  requireText(story, 'class="feature-summary"', `${projectHref} ${name} 상시 노출 핵심 설명`);
  requireText(story, `<h2>${name}</h2>`, `${projectHref} 기능 제목`);
  const explanationClass = id === "learning-memory" ? 'class="memory-purpose-list"' : id === "document-discovery" ? 'class="feature-proof"' : 'class="feature-purpose-list"';
  requireText(story, explanationClass, `${projectHref} ${name} 그림과 이어지는 본문 설명`);
  requireText(story, id === "learning-memory" ? 'class="memory-outcome"' : 'class="feature-outcome"', `${projectHref} ${name} 사용자 변화 설명`);
  rejectText(story, 'class="feature-decision-list"', `${projectHref} ${name} 반복형 목적·입력·결과·흐름 표`);
  rejectText(story, 'class="feature-prose"', `${projectHref} ${name} 그림·설명·효과 구조 밖의 장문 나열`);
  rejectText(story, '<details', `${projectHref} ${name} 짧은 설명을 숨기는 접이식 상세`);
}
rejectText(projectSource, '<article id="static-build"', `${projectHref} 내부 운영 자동화를 공개 기능으로 노출`);
rejectText(featuresSection, "공개 포트폴리오·정적 전달", `${projectHref} 내부 운영 자동화를 주요 기능에 노출`);
const memoryStory = fragment(projectSource, '<article id="learning-memory" class="feature-story feature-section">', "</article>", `${projectHref} 자동 학습 기록과 보류 목록`);
for (const token of ["학습보다 정리에 더 많은 시간이", "LLM을 사용하는 코딩 에이전트", "큰 개념이거나 오래 걸리는 내용", "보류 이유와 다시 볼 조건", "현재 학습을 계속", "에이전트가 다시 제안"]) {
  requireText(memoryStory, token, `${projectHref} 자동 학습 기록과 보류 판단의 구체적인 설명`);
}
for (const token of ["관문별 실습 기록", "실행 근거", "주제별 기술 문서", "다시 쓸 수 있는 설명", "홈의 Road 학습 여정"]) {
  requireText(memoryStory, token, `${projectHref} 관문 실습 기록과 범용 기술 문서의 역할 분리`);
}
for (const token of ["날짜·학습 주제·총 공부시간", "하나의 학습 기록 JSON", "캘린더와 공부시간을 포함한 날짜별 기록 화면", "학습 기록 JSON"]) {
  requireText(memoryStory, token, `${projectHref} 학습 기록 JSON 단일 원본 설명`);
}
for (const markup of ['class="memory-purpose-list"', 'class="memory-decision-overlay"', 'class="memory-speech-bubbles"', 'class="memory-speech-bubble memory-now"', 'class="memory-speech-bubble memory-later"', 'class="memory-outcome"']) {
  requireText(memoryStory, markup, `${projectHref} 자동 기록과 보류 판단의 시각 구조`);
}
requireText(memoryStory, '</div>\n          <div class="memory-decision-overlay">', `${projectHref} 자동 정리 배경 밖의 독립 판단 영역`);
for (const token of ['class="dom-flow-visual"', 'class="dom-flow"', "학습에 집중", "질문 · 설명 · 실습", "자동 정리", "날짜별 학습 기록", "로드맵 현재 위치", "기억 강화 세션", "보류 목록"]) {
  requireText(memoryStory, token, `${projectHref} 자동 기록 흐름의 DOM 도식`);
}
for (const token of ["기억 강화 연결", "확인된 지식을 별도의 세션으로 보냅니다", "기억 강화 세션의 JSON 목록", "처음 이해한 기록", "유지 결과"]) {
  requireText(memoryStory, token, `${projectHref} 자동 기록과 기억 강화 세션 연결`);
}
const memoryReinforcementStory = fragment(projectSource, '<article id="memory-reinforcement" class="feature-story feature-section">', "</article>", `${projectHref} 기억 강화 세션`);
for (const token of ["AI 엔지니어로서 성장", "기업 코딩 테스트 합격", "로드맵별 분류나 분야별 고정 할당량", "JSON 누적", "다음 확인일", "전체 결과 이력", "최근 실패·중요도·밀린 기간", "중요도가 낮은 내용도 버리지 않고 후순위", "실패·힌트·무힌트 성공·변형 적용", "처음 배운 날의 성공", "유지 근거", "learning_review.html", "기억 강화 상태 JSON"]) {
  requireText(memoryReinforcementStory, token, `${projectHref} 기억 강화 세션의 독립 기능 설명`);
}
for (const selector of [".memory-bubble-question::before", ".memory-bubble-question::after", "--memory-question-tail"]) {
  rejectText(projectCss, selector, `${projectHref} 판단 질문과 대표 그림 사이의 불필요한 연결 장식`);
}
for (const selector of [".dom-flow-visual {", "background: #f2f7f5", ".dom-flow {", ".dom-flow-panel", ".dom-flow-agent {", ".dom-flow-arrow", ".feature-cycle {", ".feature-cycle-return", "transform: rotate(90deg)"]) {
  requireText(projectCss, selector, `${projectHref} 텍스트 흐름 도식의 데스크톱·모바일 CSS`);
}
rejectText(memoryStory, 'class="memory-automation"', `${projectHref} 설명 행과 중복되는 3단계 자동 기록 띠`);
rejectText(memoryStory, 'class="memory-flow"', `${projectHref} 설명 행과 중복되는 자동 기록 흐름`);
rejectText(memoryStory, 'class="memory-visual"', `${projectHref} 대표 그림과 분리된 중복 판단 영역`);
rejectText(memoryStory, 'class="memory-branches"', `${projectHref} 대표 그림과 분리된 판단 카드`);
requireText(memoryStory, 'class="memory-heading-block"', `${projectHref} 기능 01 제목과 DOM 도식의 독립 행 배치`);
rejectText(memoryStory, 'class="memory-heading-grid"', `${projectHref} 기능 01 제목과 DOM 도식의 불필요한 같은 행 배치`);

const visibleMain = fragment(projectSource, "<main", "</main>", `${projectHref} 공개 본문`);
for (const jargon of ["Tensor Shape", "<span>History</span>", "<span>State</span>", "<span>Future</span>", "<span>Document</span>", "기존 fragment", "재구현·재실행", "정적 빌드와 검증 파이프라인"]) {
  rejectText(visibleMain, jargon, `${projectHref} 설명 없이 노출된 내부·특정 실습 용어`);
}

const detailsCount = (projectSource.match(/<details\b/g) || []).length;
if (detailsCount !== 0) findings.push(`${projectHref}: 짧은 검증 설명을 접이식 블록으로 숨기지 않아야 함 (${detailsCount}/0)`);
const validationSection = fragment(projectSource, '<section id="validation">', "</section>", `${projectHref} 학습 기록을 신뢰할 수 있는 이유`);
requireText(validationSection, 'class="trust-list"', `${projectHref} 검증 항목의 평면 목록`);
requireText(validationSection, 'id="status-limits" class="fragment-alias"', `${projectHref} 제거된 현재 구현 범위의 기존 링크 호환`);
for (const token of ["현재 구현 범위", "현재 제공하는 범위", "아직 제공하지 않는 범위"]) {
  rejectText(validationSection, token, `${projectHref} 제거된 구현 범위 비교`);
}
rejectText(projectSource, 'class="project-subsection', `${projectHref} 최상위 블록 안의 중첩 섹션`);
rejectText(projectSource, 'class="project-definition-list', `${projectHref} 기능을 다시 요약하는 구현 목록`);
rejectText(projectSource, 'class="evidence-layer-list', `${projectHref} 저장 정보를 반복하는 별도 목록`);
requireText(projectSource, 'class="project-goal-list"', `${projectHref} 독립된 핵심 목표 카드 목록`);
rejectText(projectSource, 'class="project-goal-list flat-list"', `${projectHref} 핵심 목표를 평면 목록으로 축소`);
if ((fragment(projectSource, '<section id="goals">', "</section>", `${projectHref} 핵심 목표`).match(/<li>/g) || []).length !== 5) findings.push(`${projectHref}: 핵심 목표는 장기기억 회수를 포함한 다섯 항목이어야 함`);
const comparisonCount = (projectSource.match(/class="project-(?:contrast|detail-grid)"/g) || []).length;
if (comparisonCount !== 2) findings.push(`${projectHref}: 2열 비교는 기존/개선·사용자/AI 두 쌍만 허용함 (${comparisonCount}/2)`);
rejectText(projectSource, 'class="project-stage-flow"', `${projectHref} 다열 단계 카드`);

for (const token of ["코딩 에이전트 워크플로", "프로젝트 형태", "사용자가 결정하고 수행하는 일", "코딩 에이전트가 보조하는 일", "장기 목표를 임의로 바꾸거나", "이 화면 자체가 대화형 코칭을 수행하는 별도의 백엔드 서비스는 아닙니다"]) {
  requireText(projectSource, token, `${projectHref} 역할·한계 핵심 문구`);
}
for (const token of [projectConceptKey, "자동 학습 기록과 보류 목록", "로드맵 기반 우선순위와 다음 행동", "로드맵·학습 기록 기반 코칭"]) {
  requireText(mapSource, token, "assets/js/knowledge_map.js 프로젝트 관점");
}

const serviceFlow = fragment(projectSource, '<section id="service-flow">', "</section>", `${projectHref} 학습이 이어지는 과정`);
const coachingStory = fragment(projectSource, '<article id="adaptive-coaching" class="feature-story feature-section">', "</article>", `${projectHref} 개인화 설명 기능`);
const documentStory = fragment(projectSource, '<article id="document-discovery" class="feature-story feature-section">', "</article>", `${projectHref} 문서 검색 기능`);
requireText(serviceFlow, 'class="feature-cycle"', `${projectHref} 세 기능을 잇는 순환 도식`);
for (const token of ["학습이 이어지는 과정", "질문하고 직접 확인합니다", "현재 위치와 새 근거를 비교합니다", "로드맵·기록·문서를 갱신합니다", "누적된 상태에서 다시 시작합니다", "다음 질문은 처음부터 시작하지 않습니다"]) {
  requireText(serviceFlow, token, `${projectHref} 학습이 이어지는 과정`);
}
for (const token of ["기한이 된 회상 문제", "지연 회상 결과", "다음 확인 간격", "최대 세 개", "장기기억에 남아 있는지"]) {
  requireText(serviceFlow, token, `${projectHref} 간격 회상을 포함한 학습 순환`);
}
if ((serviceFlow.match(/<li>/g) || []).length !== 4) findings.push(`${projectHref}: 학습이 이어지는 과정은 학습·판단·갱신·재사용 네 단계여야 함`);
rejectText(serviceFlow, "현재 학습 완료", `${projectHref} 기능 01과 중복되는 세부 사용 단계`);
rejectText(serviceFlow, "필요한 시점에 제안", `${projectHref} 기능 01과 중복되는 세부 사용 단계`);
rejectText(serviceFlow, `${imageRoot}/personal-learning-loop.svg`, `${projectHref} 텍스트가 고정된 서비스 흐름 SVG`);
for (const token of ['class="dom-flow-visual"', 'class="dom-flow"', "앞으로 갈 방향", "목표 · 현재 관문 · 완료 조건 · 다음 순서", "지금까지의 근거", "공부한 내용 · 확인 근거 · 막힌 지점 · 사용자의 표현", "함께 읽기", "지금 할 한 단계", "맞춤 설명과 작은 실습"]) {
  requireText(coachingStory, token, `${projectHref} 개인화 설명 흐름의 DOM 도식`);
}
rejectText(coachingStory, `${imageRoot}/adaptive-coaching-illustration.svg`, `${projectHref} 텍스트가 고정된 개인화 설명 SVG`);
rejectText(memoryStory, `${imageRoot}/learning-memory-illustration.svg`, `${projectHref} 텍스트가 고정된 자동 기록 SVG`);
requireText(documentStory, `${imageRoot}/wiki-projects.webp`, `${projectHref} 문서 검색 시각 자산`);
requireText(documentStory, `${imageRoot}/knowledge-map-project.webp`, `${projectHref} 지식 지도 시각 자산`);
if ((documentStory.match(/class="feature-proof"/g) || []).length !== 2) findings.push(`${projectHref}: 문서 검색과 지식 지도는 각각 화면·설명 한 묶음이어야 함`);
for (const token of ["흩어진 메모로 쌓지 않고", "체계적인 문서 축적", "주제와 상위·하위 관계", "빠른 검색과 연결", "기억나는 단어나 개념 관계", "찾는 시간을 줄입니다", "정리 부담이 커지는 대신"]) {
  requireText(documentStory, token, `${projectHref} 체계적인 문서 축적과 빠른 탐색의 핵심 가치`);
}
for (const token of ["검색을 해제하면", "전체 문서 계층으로 돌아갑니다", "현재 위치를 잃", "개인 프로젝트의 최상위 항목으로 연결됩니다"]) {
  rejectText(documentStory, token, `${projectHref} 핵심 가치를 흐리는 세부 UI 동작`);
}

const architectureSection = fragment(projectSource, '<section id="system-architecture">', "</section>", `${projectHref} 자동화의 역할과 경계`);
for (const token of ["자동화의 역할과 경계", 'id="data-design" class="fragment-alias"', 'id="ownership" class="fragment-alias"', "architecture-summary", "사용자는 학습하고 판단하며", "별도의 백엔드 서비스는 아닙니다", "코딩 에이전트가 저장소의 지침과 누적 상태를 읽고 갱신", "사용자가 결정하고 수행하는 일", "코딩 에이전트가 보조하는 일", "저장과 열람의 경계", "로드맵은 앞으로 갈 방향", "학습 기록 JSON은 날짜·공부한 내용·총 공부시간", "기억 강화 상태 JSON", "전체 결과 이력", "각 JSON에서 생성한 열람 화면"]) {
  requireText(architectureSection, token, `${projectHref} 자동화의 역할과 경계`);
}
requireOrdered(architectureSection, ["architecture-summary", 'class="project-detail-grid"', "저장과 열람의 경계", "장기 목표를 임의로 바꾸거나"], `${projectHref} 자동화 경계의 설명 순서`);
rejectText(architectureSection, "<span>자동 반영</span>", `${projectHref} 내부 빌드 절차의 독립 공개 항목`);
rejectText(architectureSection, "빌드 스크립트", `${projectHref} 내부 빌드 절차를 시스템 구조 본문에 노출`);
rejectText(architectureSection, "Node.js", `${projectHref} 내부 구현 도구 중심의 설명`);
if ((architectureSection.match(/<section\b/g) || []).length !== 1) findings.push(`${projectHref}: 시스템 동작 구조 안에 하위 블록을 중첩하지 않아야 함`);
for (const token of [".architecture-summary {", ".trust-list", "grid-template-columns: 1fr"]) {
  requireText(projectCss, token, `${projectHref} 자동화 경계·검증의 데스크톱·모바일 CSS`);
}
for (const token of ["학습 기록을 신뢰할 수 있는 이유", "이해 확인", "장기 유지", "처음 배운 날의 성공과 지연 회상 성공", "다음 행동", "공개 기록", "학습 → 간격 회상 → 판단 → 기록 → 다음 학습"]) {
  requireText(validationSection, token, `${projectHref} 학습 기록의 신뢰 근거`);
}
for (const token of ["JSON 원본", "캘린더 링크", "공부시간이 결합된 날짜별 카드", "상단 합계"]) {
  requireText(validationSection, token, `${projectHref} 학습 기록 JSON 교차 검증`);
}

for (const token of ['"schemaVersion": 1', '"maxPerSession": 3', '"timeBudgetMinutes": 8', '"id": "failed"', '"id": "hinted"', '"id": "recalled"', '"id": "transferred"', '"id": "ai-engineer-growth"', '"id": "coding-test-pass"', '"resultRecordRule"', '"priorityLevels"']) {
  requireText(reviewStateSource, token, "assets/data/review_state.json 회상 정책과 이력");
}
const learningHistoryData = JSON.parse(learningHistoryDataSource);
if (learningHistoryData.version !== 1 || !Array.isArray(learningHistoryData.records) || !learningHistoryData.records.length) findings.push("assets/data/learning_history.json: version 1 records 누락");
for (const record of learningHistoryData.records || []) {
  if (!record.date || !Array.isArray(record.topics) || !record.topics.length || !("studyTime" in record)) findings.push(`assets/data/learning_history.json: ${record.date || "날짜 없음"} 데이터 계약 불완전`);
}
for (const token of ["assets/data/learning_history.json", "static-fallback:learning-calendar:start", "static-fallback:learning-records:start", 'id="study-time"']) {
  requireText(token.startsWith("assets/") ? memoryStory : learningHistorySource, token, "학습 기록 JSON과 정적 렌더링 연결");
}
for (const token of ['id="review-queue"', 'data-review-dashboard', 'static-fallback:review-queue:start', 'assets/data/review_state.json', 'assets/css/review-queue.css', 'assets/js/review_queue.js']) {
  requireText(learningReviewSource, token, "learning_review.html 기억 강화 세션");
}
for (const token of ['id="deferred-learning"', 'static-fallback:deferred-learning-items:start']) requireText(learningBacklogSource, token, "learning_backlog.html 보류 학습");
rejectText(learningHistorySource, 'id="review-queue"', "learning_history.html에서 분리된 기억 강화 세션");
rejectText(learningHistorySource, 'id="deferred-learning"', "learning_history.html에서 분리된 보류 학습");
for (const token of [".review-dashboard", ".review-card.is-session-active", ".review-topic-badge", ".review-priority-badge", "@media (max-width: 720px)"]) {
  requireText(reviewCss, token, "assets/css/review-queue.css 반응형 회상 화면");
}
for (const token of ["data-review-dashboard", "lastOutcome", "is-session-active", "reviewDueCount", "reviewDelayedSuccessRate", "최근 실패·중요도·밀린 기간"]) {
  requireText(reviewJs, token, "assets/js/review_queue.js 기한 표시 동작");
}
for (const token of ["review_state.json", "reviewedAt", "delayDays", "stageIndex", "nextDue", "REVIEW_RESULT_RECORDED"]) {
  requireText(reviewRecordScript, token, "scripts/record_review_result.mjs 회상 결과 기록");
}
rejectText(reviewStateSource, '"milestoneId"', "assets/data/review_state.json 로드맵 독립 회상 목록");
rejectText(reviewStateSource, '"trackId"', "assets/data/review_state.json 분야별 고정 할당 없는 회상 목록");
const reviewState = JSON.parse(reviewStateSource);
if (reviewState.title !== "기억 강화 세션") findings.push("assets/data/review_state.json: 공개 기능명은 기억 강화 세션이어야 함");
if (reviewState.directions.map((direction) => direction.id).join("|") !== "ai-engineer-growth|coding-test-pass") {
  findings.push("assets/data/review_state.json: 복습 방향은 AI 엔지니어 성장과 기업 코딩 테스트 합격이어야 함");
}
if (new Set(reviewState.items.map((item) => item.id)).size !== reviewState.items.length) findings.push("assets/data/review_state.json: 회상 항목 ID가 중복됨");
if (!reviewState.items.some((item) => item.sourceHref.startsWith("wiki/coding-test/")) || !reviewState.items.some((item) => !item.sourceHref.startsWith("wiki/coding-test/"))) {
  findings.push("assets/data/review_state.json: AI 지식과 코딩 테스트 지식이 모두 있어야 함");
}
for (const item of reviewState.items) {
  if (!item.topicLabel || !Number.isInteger(item.priority) || !Array.isArray(item.results)) findings.push(`assets/data/review_state.json: 회상 항목 구조 불일치 ${item.id}`);
}

const siteManifest = JSON.parse(siteManifestSource);
const knowledgeManifest = JSON.parse(knowledgeManifestSource);
const conceptGraph = JSON.parse(conceptGraphSource);
const sitePages = siteManifest.pages.filter(({ href }) => href === projectHref);
const knowledgeDocuments = knowledgeManifest.documents.filter(({ href }) => href === projectHref);
const projectConcepts = conceptGraph.concepts.filter(({ conceptKey }) => conceptKey === projectConceptKey);
if (sitePages.length !== 1 || sitePages[0].title !== projectName) findings.push("site_manifest.json: 프로젝트 문서가 기존 이름과 경로에 맞게 정확히 한 번 있어야 함");
if (knowledgeDocuments.length !== 1 || knowledgeDocuments[0].title !== projectName) findings.push("knowledge_manifest.json: 프로젝트 문서가 기존 이름과 경로에 맞게 정확히 한 번 있어야 함");
if (projectConcepts.length !== 1 || !projectConcepts[0].labels.includes(projectName) || !projectConcepts[0].hrefs.includes(projectHref)) findings.push("concept_graph.json: 프로젝트 concept key·기존 이름·문서 연결 불일치");
for (const token of ["기억 강화 세션", "wiki-memory-reinforcement", `${projectHref}#memory-reinforcement`]) requireText(mapSource, token, "assets/js/knowledge_map.js 기억 강화 세션 노드");
requireText(projectSource, `<link rel="canonical" href="${projectUrl}">`, `${projectHref} 기존 canonical URL`);
requireText(sitemapSource, `/jaejun-wiki/${projectHref}`, "sitemap.xml");

const publicPortfolioSource = `${catalogSource}\n${mapSource}\n${projectSource}\n${wikiSource}\n${homeHtml}\n${mapHtml}\n${siteManifestSource}\n${knowledgeManifestSource}\n${conceptGraphSource}\n${sitemapSource}`;
for (const forbidden of ["/Users/", "file://", "재등장", "Learning Loop", "Adaptive Learning Coach", "wiki/projects/learning-loop", "assets/images/projects/learning-loop", "wiki/projects/jaejun-wiki", "assets/images/projects/jaejun-wiki"]) {
  rejectText(publicPortfolioSource, forbidden, "프로젝트 공개 원본");
}
requireText(featuredSvg, projectName, `${imageRoot}/personal-learning-loop-featured.svg`);

await Promise.all([
  requireAsset(`${imageRoot}/personal-learning-loop-featured.svg`),
  requireAsset(`${imageRoot}/wiki-projects.webp`),
  requireAsset(`${imageRoot}/knowledge-map-project.webp`),
]);

if (findings.length) {
  console.error(`PERSONAL_LEARNING_COACH_PROJECT_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`PERSONAL_LEARNING_COACH_PROJECT_AUDIT=PASS name=${projectName} assets=3 sections=${standardAnchors.length} legacyFragments=${legacyAnchors.length} features=${featureIds.length} details=${detailsCount}`);
}
