import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const wikiRoot = resolve(scriptDirectory, "..");
const projectName = "개인화 헬스 기록 코치";
const projectHref = "wiki/projects/personal-health-coach.html";
const projectConceptKey = "personal-health-coach-project";
const publicProductUrl = "https://muscleleg.github.io/jaejun-fitness-log/";
const imageRoot = "assets/images/projects/personal-health-coach";
const findings = [];

async function source(path) {
  return readFile(resolve(wikiRoot, path), "utf8");
}

function requireText(content, expected, location) {
  if (!content.includes(expected)) findings.push(`${location}: ${JSON.stringify(expected)} 누락`);
}

function rejectText(content, forbidden, location) {
  if (content.includes(forbidden)) findings.push(`${location}: 공개 금지 문자열 ${JSON.stringify(forbidden)} 발견`);
}

async function requireAsset(path) {
  try {
    const result = await stat(resolve(wikiRoot, path));
    if (!result.isFile() || result.size === 0) findings.push(`${path}: 비어 있거나 파일이 아님`);
  } catch {
    findings.push(`${path}: 시각 자산 누락`);
  }
}

const [catalogSource, mapSource, projectSource, wikiSource, homeHtml, mapHtml, siteManifestSource, knowledgeManifestSource, conceptGraphSource, sitemapSource, featuredSvg] = await Promise.all([
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
  source(`${imageRoot}/health-coaching-loop-featured.svg`),
]);

for (const [location, content] of [["content_catalog.json", catalogSource], ["knowledge_map.js", mapSource], [projectHref, projectSource], ["wiki.html", wikiSource], ["index.html", homeHtml], ["knowledge_map.html", mapHtml]]) {
  requireText(content, projectName, location);
  requireText(content, projectHref, location);
}

const catalog = JSON.parse(catalogSource);
const catalogProject = catalog.items.find(({ href }) => href === projectHref);
if (!catalogProject) {
  findings.push("content_catalog.json: 개인화 헬스 기록 코치 프로젝트 항목 누락");
} else {
  const catalogProjectSource = JSON.stringify(catalogProject);
  for (const token of ["운동·식사·체성분", "월별 운동일", "근육 자극 분포", "영양 구성"]) requireText(catalogProjectSource, token, "content_catalog.json 프로젝트 카드");
  if (catalogProject.thumbnail?.src !== `${imageRoot}/muscle-stimulation-map.webp`) findings.push("content_catalog.json: 개인화 헬스 기록 코치 대표 썸네일 경로 불일치");
}
const requiredAnchors = ["overview", "background", "goals", "features", "daily-records", "workout-calendar", "workout-history", "muscle-map", "nutrition-analysis", "body-composition", "record-coaching", "service-flow", "system-architecture", "data-design", "ownership", "validation", "status-limits"];
const legacyAnchors = ["problem", "coaching-loop", "record-model", "evidence-boundary", "decision-views", "workout-coaching", "nutrition-body"];
for (const anchor of requiredAnchors) requireText(projectSource, `id="${anchor}"`, `${projectHref} 필수 기능 구간`);
for (const anchor of legacyAnchors) requireText(projectSource, `id="${anchor}"`, `${projectHref} 기존 링크 호환 구간`);
for (const heading of ["개발 배경", "핵심 목표", "주요 기능", "기록이 다음 행동으로 이어지는 과정", "기록과 코칭의 역할과 경계", "헬스 기록을 신뢰할 수 있는 이유"]) requireText(projectSource, `<h2>${heading}</h2>`, `${projectHref} 독자 중심 목차`);
requireText(projectSource, `<header id="overview" class="hero">`, `${projectHref} 상단 프로젝트 개요`);
rejectText(projectSource, `<section id="overview">`, `${projectHref} 중복 프로젝트 개요`);
requireText(projectSource, `<ol class="feature-directory"`, `${projectHref} 정적 주요 기능 목차`);
rejectText(projectSource, `class="feature-index"`, `${projectHref} 클릭형 기능 목차`);
rejectText(projectSource, `class="project-scroll-nav"`, `${projectHref} 스크롤 이동 목차`);
for (const [id, number, heading] of [["daily-records", "01", "일일 기록 관리"], ["workout-calendar", "02", "월별 운동 캘린더"], ["workout-history", "03", "운동 수행 이력"], ["muscle-map", "04", "근육 자극 시각화"], ["nutrition-analysis", "05", "식사·영양 성분 분석"], ["body-composition", "06", "체성분 변화 분석"], ["record-coaching", "07", "기록 기반 코칭"]]) {
  requireText(projectSource, `<article id="${id}" class="feature-story feature-section`, `${projectHref} 기능 ${number} 독립 영역`);
  requireText(projectSource, `<span class="feature-number">기능 ${number}</span>`, `${projectHref} 기능 ${number} 번호`);
  requireText(projectSource, `<h2>${heading}</h2>`, `${projectHref} 기능 ${number} 제목`);
}
const featureDirectoryStart = projectSource.indexOf(`<section id="features">`);
const featureDirectoryEnd = projectSource.indexOf(`</section>`, featureDirectoryStart);
if (featureDirectoryStart < 0 || featureDirectoryEnd < 0 || projectSource.slice(featureDirectoryStart, featureDirectoryEnd).includes(`<article`)) findings.push(`${projectHref}: 주요 기능 목차와 기능 본문이 분리되어야 함`);
const outcomeCount = (projectSource.match(/class="scenario-outcome"/g) || []).length;
if (outcomeCount !== 7) findings.push(`${projectHref}: 기능별 사용자 변화가 정확히 7개여야 함 (${outcomeCount}/7)`);
for (const token of ["순환의 결과", "자연어 입력과 JSON 기록, 정적 대시보드를 분리한 개인 시스템", "사용자 사실", "재현 가능한 계산", "AI 해석", "교차 확인", "검증의 목적"]) requireText(projectSource, token, `${projectHref} 기능 연결·역할·신뢰 흐름`);
for (const heading of ["서비스 이용 흐름", "시스템 구성", "데이터 설계", "사용자와 AI의 역할", "검증 방식", "현재 상태 및 한계"]) rejectText(projectSource, `<h2>${heading}</h2>`, `${projectHref} 이전 나열형 목차`);
for (const label of ["구현 상세", "계산 및 판정 기준", "계산 및 해석 기준", "판정 기준", "검증 항목"]) requireText(projectSource, `<span>${label}</span>`, `${projectHref} 접이식 기술 상세`);
requireText(projectSource, "<details", `${projectHref} 접이식 기술 상세`);
const detailsCount = (projectSource.match(/<details\b/g) || []).length;
if (detailsCount < 9) findings.push(`${projectHref}: 기능·구현·검증의 접이식 기술 상세가 부족함 (${detailsCount}/9)`);
for (const token of ["사용자 역할", "AI 활용 범위", "의료 진단", publicProductUrl]) requireText(projectSource, token, `${projectHref} 역할·한계·공개 링크`);
for (const token of ["개인 헬스 기록 하네스", "코딩 에이전트가 자연어 입력을 기록으로 바꾸고", "JSON 형태의 데이터", "실제 공개 화면", "Function Tool 기반 입력", "챗봇이 자연어에서 필요한 도구와 인자를 선택하고", "Function Tool 실행 API와 영속 저장소", "기록 스키마와 계산·시각화 규칙"]) requireText(projectSource, token, `${projectHref} 입력 하네스·구조화 데이터·애플리케이션 전환 경계`);
for (const token of ["백그라운드에서 관찰", "웨어러블", "의료기기", "사용자 계정"]) rejectText(projectSource, token, `${projectHref} 제거한 이전 한계 문구`);
for (const token of [projectConceptKey, "사실·규칙·해석 분리", "운동 증량 판정", "영양 범위 추정"]) requireText(mapSource, token, "assets/js/knowledge_map.js 프로젝트 관점");

const siteManifest = JSON.parse(siteManifestSource);
const knowledgeManifest = JSON.parse(knowledgeManifestSource);
const conceptGraph = JSON.parse(conceptGraphSource);
const sitePages = siteManifest.pages.filter(({ href }) => href === projectHref);
const knowledgeDocuments = knowledgeManifest.documents.filter(({ href }) => href === projectHref);
const projectConcepts = conceptGraph.concepts.filter(({ conceptKey }) => conceptKey === projectConceptKey);
if (sitePages.length !== 1 || sitePages[0].title !== projectName) findings.push("site_manifest.json: 프로젝트 문서가 이름과 경로에 맞게 정확히 한 번 있어야 함");
if (knowledgeDocuments.length !== 1 || knowledgeDocuments[0].title !== projectName) findings.push("knowledge_manifest.json: 프로젝트 문서가 이름과 경로에 맞게 정확히 한 번 있어야 함");
if (projectConcepts.length !== 1 || !projectConcepts[0].labels.includes(projectName) || !projectConcepts[0].hrefs.includes(projectHref)) findings.push("concept_graph.json: 프로젝트 concept key·이름·문서 연결 불일치");
requireText(sitemapSource, `/jaejun-wiki/${projectHref}`, "sitemap.xml");

const publicPortfolioSource = `${catalogSource}\n${mapSource}\n${projectSource}\n${wikiSource}\n${homeHtml}\n${mapHtml}\n${siteManifestSource}\n${knowledgeManifestSource}\n${conceptGraphSource}\n${sitemapSource}`;
for (const forbidden of ["/Users/", "file://", "헬스 저장소"]) rejectText(publicPortfolioSource, forbidden, "프로젝트 공개 원본");
requireText(featuredSvg, projectName, `${imageRoot}/health-coaching-loop-featured.svg`);

await Promise.all([
  requireAsset(`${imageRoot}/health-coaching-loop-featured.svg`),
  requireAsset(`${imageRoot}/coaching-next-actions.webp`),
  requireAsset(`${imageRoot}/muscle-stimulation-map.webp`),
  requireAsset(`${imageRoot}/daily-records.webp`),
  requireAsset(`${imageRoot}/workout-calendar.webp`),
  requireAsset(`${imageRoot}/workout-history.webp`),
  requireAsset(`${imageRoot}/nutrition-analysis.webp`),
]);

for (const screenshot of ["daily-records.webp", "workout-calendar.webp", "workout-history.webp", "nutrition-analysis.webp"]) {
  requireText(projectSource, `${imageRoot}/${screenshot}`, `${projectHref} 기능별 실제 화면`);
}

if (findings.length) {
  console.error(`PERSONAL_HEALTH_COACH_PROJECT_AUDIT=FAIL findings=${findings.length}`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`PERSONAL_HEALTH_COACH_PROJECT_AUDIT=PASS name=${projectName} assets=7 sections=${requiredAnchors.length} legacyFragments=${legacyAnchors.length} details=${detailsCount}`);
}
