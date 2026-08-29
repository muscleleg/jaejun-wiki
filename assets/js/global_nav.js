(() => {
  const scriptUrl = new URL(document.currentScript.src);
  const projectRoot = new URL("../../", scriptUrl);
  const currentPath = location.pathname;
  const isProjectHome = currentPath === projectRoot.pathname
    || currentPath === new URL("index.html", projectRoot).pathname;
  const items = [
    ["index.html", "⌂ 홈", isProjectHome],
    ["roadmap.html", "로드맵", currentPath.includes("/roadmaps/") || currentPath.endsWith("/roadmap.html") || currentPath.endsWith("/pytorch_professional_roadmap.html") || currentPath.endsWith("/wiki/coding-test/index.html")],
    ["wiki.html", "위키", currentPath.includes("/wiki/") || currentPath.endsWith("/wiki.html")],
    ["knowledge_map.html", "지도", currentPath.endsWith("/knowledge_map.html")],
    ["learning_history.html", "기록", currentPath.endsWith("/learning_history.html")],
  ];

  const navigationStyle = document.createElement("link");
  navigationStyle.rel = "stylesheet";
  navigationStyle.href = new URL("assets/css/navigation.css", projectRoot).href;
  document.head.appendChild(navigationStyle);

  if (currentPath.includes("/wiki/")) {
    const tocStyle = document.createElement("link");
    tocStyle.rel = "stylesheet";
    tocStyle.href = new URL("assets/css/article-toc.css?v=20260829-toc-height-1", projectRoot).href;
    document.head.appendChild(tocStyle);
  }

  const nav = document.createElement("nav");
  nav.className = "global-learning-nav";
  nav.setAttribute("aria-label", "공통 학습 문서 이동");
  for (const [path, label, isCurrent] of items) {
    const link = document.createElement("a");
    link.href = new URL(path, projectRoot).href;
    link.textContent = label;
    if (isCurrent) link.setAttribute("aria-current", "page");
    nav.appendChild(link);
  }
  document.body.appendChild(nav);

  if (currentPath.includes("/wiki/")) {
    const hasHeading = document.querySelector("main h1");
    const firstConceptHeading = document.querySelector("main h2");
    if (!hasHeading && firstConceptHeading) {
      const heading = document.createElement("h1");
      heading.className = "generated-document-title";
      heading.textContent = firstConceptHeading.textContent.trim();
      firstConceptHeading.before(heading);
      document.title = `${heading.textContent} · ${document.title}`;
    }
    const tocScript = document.createElement("script");
    tocScript.src = new URL("assets/js/article_toc.js?v=20260828-unified-5", projectRoot).href;
    document.body.appendChild(tocScript);
  }
})();
