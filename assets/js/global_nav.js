(() => {
  const scriptUrl = new URL(document.currentScript.src);
  const projectRoot = new URL("../../", scriptUrl);
  const currentPath = location.pathname;
  const legacyRecordDestinations = {
    "#deferred-learning": "learning_backlog.html",
    "#review-queue": "learning_review.html",
  };
  if (currentPath.endsWith("/learning_history.html") && legacyRecordDestinations[location.hash]) {
    location.replace(new URL(legacyRecordDestinations[location.hash], projectRoot).href);
    return;
  }
  const isBlogReadingView = currentPath.includes("/wiki/")
    && new URLSearchParams(location.search).get("view") === "blog";
  const isProjectHome = currentPath === projectRoot.pathname
    || currentPath === new URL("index.html", projectRoot).pathname;
  const items = [
    ["index.html", "홈", isProjectHome],
    ["projects.html", "프로젝트", currentPath.endsWith("/projects.html")],
    ["blog.html", "블로그", isBlogReadingView || currentPath.endsWith("/blog.html")],
    ["wiki.html", "위키", !isBlogReadingView && (currentPath.includes("/wiki/") || currentPath.endsWith("/wiki.html") || currentPath.endsWith("/knowledge_map.html"))],
    ["roadmap.html", "로드맵", currentPath.includes("/roadmaps/") || currentPath.endsWith("/roadmap.html") || currentPath.endsWith("/pytorch_professional_roadmap.html") || currentPath.endsWith("/wiki/coding-test/index.html")],
  ];

  const navigationStyle = document.createElement("link");
  navigationStyle.rel = "stylesheet";
  navigationStyle.href = new URL("assets/css/navigation.css?v=20260901-record-pages-1", projectRoot).href;
  document.head.appendChild(navigationStyle);

  if (isBlogReadingView) {
    document.body.classList.add("blog-reading-view");
    const blogReadingStyle = document.createElement("style");
    blogReadingStyle.textContent = ".blog-reading-view .article-understanding { display: none !important; }";
    document.head.appendChild(blogReadingStyle);
  }

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

  const recordPageNames = ["learning_history.html", "learning_backlog.html", "learning_review.html"];
  const isLearningHistory = recordPageNames.some((pageName) => currentPath.endsWith(`/${pageName}`));
  const recordMenuWrapper = document.createElement("div");
  recordMenuWrapper.className = "global-learning-nav-record";

  const recordMenuButton = document.createElement("button");
  recordMenuButton.type = "button";
  recordMenuButton.className = "global-learning-nav-record-trigger";
  recordMenuButton.textContent = "기록";
  recordMenuButton.setAttribute("aria-expanded", "false");
  recordMenuButton.setAttribute("aria-controls", "globalLearningRecordMenu");
  recordMenuButton.setAttribute("aria-haspopup", "true");
  recordMenuButton.setAttribute("aria-label", "기록 메뉴 열기");
  if (isLearningHistory) recordMenuButton.setAttribute("aria-current", "page");

  const recordMenu = document.createElement("div");
  recordMenu.id = "globalLearningRecordMenu";
  recordMenu.className = "global-learning-nav-record-menu";
  recordMenu.hidden = true;
  recordMenu.setAttribute("aria-label", "학습 기록 이동");

  const recordItems = [
    ["learning_history.html", "학습 기록", currentPath.endsWith("/learning_history.html")],
    ["learning_backlog.html", "나중에 다시 할 학습", currentPath.endsWith("/learning_backlog.html")],
    ["learning_review.html", "기억 강화 세션", currentPath.endsWith("/learning_review.html")],
  ];

  for (const [path, label, isCurrent] of recordItems) {
    const link = document.createElement("a");
    link.href = new URL(path, projectRoot).href;
    link.textContent = label;
    if (isCurrent) link.setAttribute("aria-current", "page");
    recordMenu.appendChild(link);
  }

  const setRecordMenuOpen = (isOpen, { restoreFocus = false } = {}) => {
    recordMenu.hidden = !isOpen;
    recordMenuButton.setAttribute("aria-expanded", String(isOpen));
    recordMenuButton.setAttribute("aria-label", isOpen ? "기록 메뉴 닫기" : "기록 메뉴 열기");
    recordMenuWrapper.classList.toggle("is-open", isOpen);
    if (restoreFocus) recordMenuButton.focus();
  };

  recordMenuButton.addEventListener("click", () => {
    setRecordMenuOpen(recordMenuButton.getAttribute("aria-expanded") !== "true");
  });

  recordMenuButton.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setRecordMenuOpen(true);
    const links = [...recordMenu.querySelectorAll("a")];
    (event.key === "ArrowDown" ? links[0] : links.at(-1))?.focus();
  });

  recordMenu.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setRecordMenuOpen(false, { restoreFocus: true });
  });

  recordMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setRecordMenuOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!recordMenuWrapper.contains(event.target)) setRecordMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && recordMenuButton.getAttribute("aria-expanded") === "true") {
      setRecordMenuOpen(false, { restoreFocus: true });
    }
  });

  recordMenuWrapper.append(recordMenuButton, recordMenu);
  nav.appendChild(recordMenuWrapper);
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
    tocScript.src = new URL("assets/js/article_toc.js?v=20260830-page-optout-1", projectRoot).href;
    document.body.appendChild(tocScript);
  }
})();
