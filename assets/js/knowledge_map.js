(() => {
  const tabs = [...document.querySelectorAll("#mapViewTabs [data-view]")];
  const trees = [...document.querySelectorAll("[data-map-view-tree]")];
  const descriptions = [...document.querySelectorAll("[data-map-view-description]")];
  const detailPanels = [...document.querySelectorAll("[data-map-concept-detail]")];
  const detailEmpty = document.getElementById("mapDetailEmpty");
  const search = document.getElementById("mapSearch");
  const empty = document.getElementById("mapEmpty");
  if (!tabs.length || !trees.length || !search) return;

  let activeView = tabs[0].dataset.view;

  function activeTree() {
    return trees.find((tree) => tree.dataset.mapViewTree === activeView);
  }

  function setExpanded(toggle, expanded) {
    const item = toggle.closest("li");
    const children = item && [...item.children].find((child) => child.matches(".map-children"));
    if (!children) return;
    children.hidden = !expanded;
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "−" : "+";
  }

  function selectConcept(concept) {
    document.querySelectorAll(".map-concept.selected").forEach((element) => element.classList.remove("selected"));
    document.querySelectorAll(`.map-concept[data-concept="${CSS.escape(concept)}"]`).forEach((element) => element.classList.add("selected"));
    detailPanels.forEach((panel) => { panel.hidden = panel.dataset.mapConceptDetail !== concept; });
    if (detailEmpty) detailEmpty.hidden = detailPanels.some((panel) => !panel.hidden);
  }

  function applySearch() {
    const tree = activeTree();
    if (!tree) return;
    const query = search.value.trim().toLocaleLowerCase("ko");
    const items = [...tree.querySelectorAll("li[data-occurrence-id]")];
    const directMatches = new Set(items.filter((item) => {
      const button = item.querySelector(":scope > .map-node-row .map-concept");
      const text = `${button?.dataset.concept || ""} ${button?.textContent || ""}`.toLocaleLowerCase("ko");
      return !query || text.includes(query);
    }));
    const visible = new Set();
    for (const item of directMatches) {
      let current = item;
      while (current?.matches?.("li[data-occurrence-id]")) {
        visible.add(current);
        current = current.parentElement?.closest("li[data-occurrence-id]");
      }
    }
    items.forEach((item) => {
      item.hidden = query ? !visible.has(item) : false;
      const concept = item.querySelector(":scope > .map-node-row .map-concept");
      concept?.classList.toggle("search-match", Boolean(query && directMatches.has(item)));
      const toggle = item.querySelector(":scope > .map-node-row .map-toggle:not(.placeholder)");
      if (query && toggle && visible.has(item)) setExpanded(toggle, true);
    });
    if (empty) empty.hidden = directMatches.size > 0;
  }

  function setView(viewId) {
    activeView = viewId;
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(tab.dataset.view === viewId)));
    trees.forEach((tree) => { tree.hidden = tree.dataset.mapViewTree !== viewId; });
    descriptions.forEach((description) => { description.hidden = description.dataset.mapViewDescription !== viewId; });
    applySearch();
  }

  document.getElementById("mapViewTabs")?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-view]");
    if (tab) setView(tab.dataset.view);
  });
  document.getElementById("mindmapTrees")?.addEventListener("click", (event) => {
    const toggle = event.target.closest(".map-toggle:not(.placeholder)");
    if (toggle) {
      setExpanded(toggle, toggle.getAttribute("aria-expanded") !== "true");
      return;
    }
    const concept = event.target.closest(".map-concept")?.dataset.concept;
    if (concept) selectConcept(concept);
  });
  search.addEventListener("input", applySearch);
  setView(activeView);
})();
