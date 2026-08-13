(() => {
  const scriptUrl = new URL(document.currentScript.src);
  const projectRoot = new URL("../../", scriptUrl);
  const currentPath = location.pathname;
  const items = [
    ["index.html", "⌂ 홈", currentPath.endsWith("/index.html")],
    ["pytorch_professional_roadmap.html", "로드맵", currentPath.includes("/roadmaps/") || currentPath.endsWith("/pytorch_professional_roadmap.html")],
    ["wiki.html", "위키", currentPath.includes("/wiki/") || currentPath.endsWith("/wiki.html")],
    ["learning_history.html", "기록", currentPath.endsWith("/learning_history.html")],
  ];

  const style = document.createElement("style");
  style.textContent = `
    .global-learning-nav {
      position: fixed; top: auto; right: 18px; bottom: 18px; left: auto; z-index: 1000;
      display: flex; flex-wrap: nowrap; align-items: center; gap: 5px;
      width: max-content; max-width: calc(100vw - 36px); height: auto; min-height: 0;
      margin: 0; padding: 6px; box-sizing: border-box;
      border: 1px solid rgba(24,33,29,.16); border-radius: 999px;
      background: rgba(255,253,248,.94); box-shadow: 0 10px 30px rgba(20,35,28,.18);
      backdrop-filter: blur(12px);
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard Variable", Pretendard,
        "Noto Sans KR", "Apple SD Gothic Neo", sans-serif;
    }
    .global-learning-nav a {
      display: block; flex: 0 0 auto; width: auto; height: auto; min-height: 0; margin: 0;
      padding: 7px 10px; color: #315b4b; border-radius: 999px;
      font-size: 12px; font-weight: 800; line-height: 1.2; text-decoration: none;
      white-space: nowrap; writing-mode: horizontal-tb;
    }
    .global-learning-nav a[aria-current="page"] { color: white; background: #176b4d; }
    .global-learning-nav a:hover, .global-learning-nav a:focus-visible {
      color: white; background: #176b4d; outline: none;
    }
    .home-fab, .home-link { display: none !important; }
    @media (max-width: 520px) {
      .global-learning-nav { right: 9px; bottom: 9px; left: 9px; width: auto; max-width: none; justify-content: center; }
      .global-learning-nav a { flex: 1; text-align: center; }
    }
  `;
  document.head.appendChild(style);

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
})();
