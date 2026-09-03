(() => {
  const root = document.getElementById("wiki-discovery");
  if (!root) return;

  const input = root.querySelector("input[type='search']");
  const categoryButtons = [...root.querySelectorAll("[data-category]")];
  const tagButtons = [...root.querySelectorAll("[data-tag]")];
  const sections = [...root.querySelectorAll(".wiki-tree-category[data-category]")];
  const status = root.querySelector(".wiki-search-status");
  const selectedTags = new Set();
  let category = "all";

  function linkMatches(link, query) {
    const tagIds = new Set((link.dataset.tags || "").split(/\s+/).filter(Boolean));
    const tagMatch = !selectedTags.size || [...selectedTags].some((tag) => tagIds.has(tag));
    const searchText = (link.dataset.searchText || link.textContent || "").toLocaleLowerCase("ko");
    return tagMatch && (!query || searchText.includes(query));
  }

  function render() {
    const query = input.value.trim().toLocaleLowerCase("ko");
    let directMatches = 0;
    let visibleRoots = 0;

    for (const section of sections) {
      const categoryMatch = category === "all" || section.dataset.category === category;
      let sectionVisible = false;
      for (const group of section.querySelectorAll(".wiki-tree-root")) {
        const links = [...group.querySelectorAll(".wiki-search-result")];
        const matches = links.filter((link) => categoryMatch && linkMatches(link, query));
        directMatches += matches.length;
        group.hidden = matches.length === 0;
        group.classList.toggle("is-filter-context", matches.length > 0 && matches.length < links.length);
        for (const link of links) link.classList.toggle("wiki-search-context", matches.length > 0 && !matches.includes(link));
        if (matches.length) {
          visibleRoots += 1;
          sectionVisible = true;
          const children = group.querySelector(".wiki-tree-children");
          const toggle = group.querySelector(".wiki-tree-toggle");
          if ((query || selectedTags.size) && children && toggle) setExpanded(toggle, children, true);
        }
      }
      section.hidden = !sectionVisible;
    }

    categoryButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.category === category)));
    tagButtons.forEach((button) => button.setAttribute("aria-pressed", String(
      button.dataset.tag === "all" ? selectedTags.size === 0 : selectedTags.has(button.dataset.tag),
    )));
    if (status) status.textContent = (query || selectedTags.size || category !== "all")
      ? `${directMatches}개 문서가 일치합니다. 일치 문서가 속한 상위 묶음 ${visibleRoots}개를 표시합니다.`
      : `전체 문서의 최상위 묶음 ${visibleRoots}개를 표시합니다. 하위 문서는 문서별 펼치기 버튼으로 확인할 수 있습니다.`;
  }

  function setExpanded(button, children, expanded) {
    const count = Number(button.dataset.childCount || 0);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = `하위 문서 ${count}개 ${expanded ? "접기" : "펼치기"}`;
    children.hidden = !expanded;
  }

  root.addEventListener("click", (event) => {
    const toggle = event.target.closest(".wiki-tree-toggle");
    if (toggle) {
      const children = document.getElementById(toggle.getAttribute("aria-controls"));
      if (children) setExpanded(toggle, children, toggle.getAttribute("aria-expanded") !== "true");
      return;
    }
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      category = categoryButton.dataset.category;
      render();
      return;
    }
    const tagButton = event.target.closest("[data-tag]");
    if (!tagButton) return;
    const tag = tagButton.dataset.tag;
    if (tag === "all") selectedTags.clear();
    else if (selectedTags.has(tag)) selectedTags.delete(tag);
    else selectedTags.add(tag);
    render();
  });
  input.addEventListener("input", render);

  const hashCategory = decodeURIComponent(location.hash.slice(1)).replace(/^wiki-category-/, "");
  if (categoryButtons.some((button) => button.dataset.category === hashCategory)) category = hashCategory;
  render();
})();
