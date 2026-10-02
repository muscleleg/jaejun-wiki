(() => {
  const root = document.getElementById("wiki-discovery");
  if (!root) return;

  const input = root.querySelector("input[type='search']");
  const categoryInputs = [...root.querySelectorAll("#wikiCategoryFilters input[data-category]")];
  const tagInputs = [...root.querySelectorAll("#wikiTagFilters input[data-tag]")];
  const filterToggles = [...root.querySelectorAll("[data-wiki-filter-toggle]")];
  const filterForms = [...root.querySelectorAll("[data-wiki-filter-form]")];
  const categoryValue = root.querySelector("#wikiCategoryValue");
  const tagCount = root.querySelector("#wikiTagCount");
  const resetFilters = root.querySelector('[data-wiki-filter-reset="all"]');
  const viewButtons = [...root.querySelectorAll("[data-wiki-view]")];
  const treeResults = root.querySelector("#wikiSearchResults");
  const recentView = root.querySelector("#wikiRecentView");
  const recentResults = root.querySelector("#wikiRecentResults");
  const pagination = root.querySelector("#wikiPagination");
  const sections = [...root.querySelectorAll(".wiki-tree-category[data-category]")];
  const status = root.querySelector(".wiki-search-status");
  const selectedTags = new Set();
  const pageSize = 10;
  const viewStorageKey = "jwiki-wiki-view";
  const recentDocuments = [...recentResults.querySelectorAll(".wiki-search-result")];
  const pageButtons = [...pagination.querySelectorAll("[data-wiki-page]")];
  const numberedPages = pageButtons.filter((button) => /^\d+$/.test(button.dataset.wikiPage));
  const previousButton = pageButtons.find((button) => button.dataset.wikiPage === "previous");
  const nextButton = pageButtons.find((button) => button.dataset.wikiPage === "next");
  const startGap = pagination.querySelector('[data-wiki-gap="start"]');
  const endGap = pagination.querySelector('[data-wiki-gap="end"]');
  let category = "all";
  let currentPage = 1;
  let view = "tree";
  let openFilter = null;
  try {
    if (localStorage.getItem(viewStorageKey) === "recent") view = "recent";
  } catch {
    // Browsers that block local storage can still switch views for this visit.
  }

  function linkMatches(link, query) {
    const tagIds = new Set((link.dataset.tags || "").split(/\s+/).filter(Boolean));
    const tagMatch = !selectedTags.size || [...selectedTags].some((tag) => tagIds.has(tag));
    const searchText = (link.dataset.searchText || link.textContent || "").toLocaleLowerCase("ko");
    return tagMatch && (!query || searchText.includes(query));
  }

  function renderTree(query) {
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

    return (query || selectedTags.size || category !== "all")
      ? `${directMatches}개 문서가 일치합니다. 일치 문서가 속한 상위 묶음 ${visibleRoots}개를 표시합니다.`
      : `전체 문서의 최상위 묶음 ${visibleRoots}개를 표시합니다. 하위 문서는 문서별 펼치기 버튼으로 확인할 수 있습니다.`;
  }

  function renderPagination(totalPages) {
    const pages = new Set([1, totalPages]);
    for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page += 1) pages.add(page);
    numberedPages.forEach((button) => {
      const page = Number(button.dataset.wikiPage);
      button.hidden = !pages.has(page);
      if (page === currentPage) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (previousButton) previousButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
    if (startGap) startGap.hidden = currentPage <= 4;
    if (endGap) endGap.hidden = currentPage >= totalPages - 3;
    pagination.hidden = totalPages <= 1;
  }

  function renderRecent(query) {
    const matches = recentDocuments.filter((link) => (
      (category === "all" || category === link.dataset.category) && linkMatches(link, query)
    ));
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(totalPages, Math.max(1, currentPage));
    const start = (currentPage - 1) * pageSize;
    const pageDocuments = matches.slice(start, start + pageSize);
    const visible = new Set(pageDocuments);
    recentDocuments.forEach((link) => { link.hidden = !visible.has(link); });
    renderPagination(totalPages);
    return matches.length
      ? `${matches.length}개 문서 · 최신 등록순 · ${start + 1}–${start + pageDocuments.length}개 표시 · ${currentPage}/${totalPages}페이지`
      : "일치하는 문서가 없습니다.";
  }

  function render() {
    const query = input.value.trim().toLocaleLowerCase("ko");
    treeResults.hidden = view !== "tree";
    recentView.hidden = view !== "recent";
    const categoryLabel = categoryInputs.find((option) => option.dataset.category === category)?.dataset.label || "전체";
    const tagLabels = tagInputs.filter((option) => selectedTags.has(option.dataset.tag)).map((option) => `#${option.dataset.label}`);
    categoryValue.hidden = category === "all";
    categoryValue.textContent = categoryLabel;
    tagCount.hidden = selectedTags.size === 0;
    tagCount.textContent = String(selectedTags.size);
    filterToggles.forEach((button) => {
      const isCategory = button.dataset.wikiFilterToggle === "category";
      button.classList.toggle("is-active", isCategory ? category !== "all" : selectedTags.size > 0);
      const description = isCategory ? `카테고리: ${categoryLabel}` : `태그: ${tagLabels.length ? tagLabels.join(", ") : "전체"}`;
      button.title = description;
      button.setAttribute("aria-label", description);
    });
    resetFilters.disabled = category === "all" && selectedTags.size === 0;
    viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.wikiView === view)));
    const message = view === "recent" ? renderRecent(query) : renderTree(query);
    if (status) status.textContent = message;
  }

  function setExpanded(button, children, expanded) {
    const count = Number(button.dataset.childCount || 0);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = `하위 문서 ${count}개 ${expanded ? "접기" : "펼치기"}`;
    children.hidden = !expanded;
  }

  function closeFilter(restoreFocus = false) {
    const trigger = filterToggles.find((button) => button.dataset.wikiFilterToggle === openFilter);
    filterForms.forEach((form) => { form.hidden = true; });
    filterToggles.forEach((button) => button.setAttribute("aria-expanded", "false"));
    openFilter = null;
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  filterForms.forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.dataset.wikiFilterForm === "category") {
      category = categoryInputs.find((option) => option.checked)?.dataset.category || "all";
    } else {
      selectedTags.clear();
      tagInputs.filter((option) => option.checked).forEach((option) => selectedTags.add(option.dataset.tag));
    }
    currentPage = 1;
    render();
    closeFilter(true);
  }));

  root.addEventListener("click", (event) => {
    const filterToggle = event.target.closest("button[data-wiki-filter-toggle]");
    if (filterToggle) {
      const target = filterToggle.dataset.wikiFilterToggle;
      const wasOpen = openFilter === target;
      closeFilter();
      if (!wasOpen) {
        if (target === "category") categoryInputs.forEach((option) => { option.checked = option.dataset.category === category; });
        else tagInputs.forEach((option) => { option.checked = selectedTags.has(option.dataset.tag); });
        openFilter = target;
        filterForms.find((form) => form.dataset.wikiFilterForm === target).hidden = false;
        filterToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }
    const filterReset = event.target.closest("button[data-wiki-filter-reset]");
    if (filterReset && !filterReset.disabled) {
      const target = filterReset.dataset.wikiFilterReset;
      if (target === "category") {
        categoryInputs.forEach((option) => { option.checked = option.dataset.category === "all"; });
      } else if (target === "tag") {
        tagInputs.forEach((option) => { option.checked = false; });
      } else {
        category = "all";
        selectedTags.clear();
        currentPage = 1;
        closeFilter();
        render();
      }
      return;
    }
    const viewButton = event.target.closest("button[data-wiki-view]");
    if (viewButton) {
      view = viewButton.dataset.wikiView;
      try {
        localStorage.setItem(viewStorageKey, view);
      } catch {
        // Persisting the preference is optional.
      }
      render();
      return;
    }
    const pageButton = event.target.closest("button[data-wiki-page]");
    if (pageButton && !pageButton.disabled) {
      if (pageButton.dataset.wikiPage === "previous") currentPage -= 1;
      else if (pageButton.dataset.wikiPage === "next") currentPage += 1;
      else currentPage = Number(pageButton.dataset.wikiPage);
      render();
      pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
      recentView.scrollIntoView({ block: "start" });
      return;
    }
    const toggle = event.target.closest(".wiki-tree-toggle");
    if (toggle) {
      const children = document.getElementById(toggle.getAttribute("aria-controls"));
      if (children) setExpanded(toggle, children, toggle.getAttribute("aria-expanded") !== "true");
      return;
    }
  });
  input.addEventListener("input", () => {
    currentPage = 1;
    render();
  });
  function dismissOutsideFilter(event) {
    if (!openFilter) return;
    const trigger = filterToggles.find((button) => button.dataset.wikiFilterToggle === openFilter);
    if (!trigger.closest(".wiki-filter-dropdown").contains(event.target)) closeFilter();
  }
  document.addEventListener("click", dismissOutsideFilter);
  document.addEventListener("focusin", dismissOutsideFilter);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openFilter) {
      event.preventDefault();
      closeFilter(true);
    }
  });

  const hashCategory = decodeURIComponent(location.hash.slice(1)).replace(/^wiki-category-/, "");
  if (categoryInputs.some((option) => option.dataset.category === hashCategory)) category = hashCategory;
  render();
})();
