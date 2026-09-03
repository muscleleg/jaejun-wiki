(() => {
  const referenceIds = new Set(["adaptive", "method", "roadmap", "practice-pool", "chapters", "routine", "job-ready", "expansion"]);
  const sections = [...document.querySelectorAll("main > section[id]")];
  const contents = document.querySelector('nav[aria-label="목차"]');
  if (!sections.length) return;

  for (const section of sections) {
    if (referenceIds.has(section.id)) section.classList.add("roadmap-reference-section");
  }
  for (const link of contents?.querySelectorAll("a[href^='#']") || []) {
    if (referenceIds.has(link.hash.slice(1))) link.classList.add("roadmap-reference-link");
  }

  const switcher = document.querySelector(".roadmap-view-switcher");
  if (!switcher) return;
  const buttons = [...switcher.querySelectorAll("button")];

  function setMode(mode) {
    const full = mode === "full";
    document.documentElement.dataset.roadmapView = mode;
    document.querySelectorAll(".roadmap-reference-section, .roadmap-reference-link").forEach((element) => { element.hidden = !full; });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    switcher.querySelector("p strong").textContent = full ? "전체 참고서" : "요약 보기";
  }

  function modeForHash() {
    const target = location.hash.slice(1);
    return referenceIds.has(target) ? "full" : "overview";
  }

  buttons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  addEventListener("hashchange", () => {
    if (referenceIds.has(location.hash.slice(1))) setMode("full");
  });
  setMode(modeForHash());
})();
