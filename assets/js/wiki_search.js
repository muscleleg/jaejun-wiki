(() => {
  const manifest = window.KNOWLEDGE_MANIFEST;
  const root = document.getElementById("wiki-discovery");
  if (!manifest || !root) return;

  const input = root.querySelector("input[type='search']");
  const filters = root.querySelector(".wiki-category-filters");
  const results = root.querySelector(".wiki-search-results");
  const status = root.querySelector(".wiki-search-status");
  const categorySections = [...document.querySelectorAll("main.wrap > section")].filter((section) => section !== root);
  let category = "all";

  const buttons = [{ id: "all", label: "전체" }, ...manifest.categories]
    .map(({ id, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.category = id;
      button.textContent = label;
      button.setAttribute("aria-pressed", id === "all" ? "true" : "false");
      return button;
    });
  filters.append(...buttons);

  function render() {
    const query = input.value.trim().toLocaleLowerCase("ko");
    const active = query || category !== "all";
    const matches = manifest.documents.filter((document) => {
      const categoryMatch = category === "all" || document.categoryKey === category;
      const haystack = `${document.title} ${document.description} ${document.category}`.toLocaleLowerCase("ko");
      return categoryMatch && (!query || haystack.includes(query));
    });

    results.replaceChildren();
    results.hidden = !active;
    categorySections.forEach((section) => { section.hidden = Boolean(active); });
    status.textContent = active
      ? `${matches.length}개 문서를 찾았습니다.`
      : `전체 ${manifest.documentCount}개 문서를 카테고리 또는 검색어로 찾을 수 있습니다.`;

    if (!active) return;
    for (const entry of matches) {
      const link = document.createElement("a");
      link.className = "wiki-link wiki-search-result";
      link.href = entry.href;
      const categoryLabel = entry.isCategoryIndex ? `${entry.category} · 상위 문서` : entry.category;
      link.innerHTML = `<em>${categoryLabel}</em><strong>${entry.title}</strong><span>${entry.description || "연결된 학습 문서"}</span>`;
      results.appendChild(link);
    }
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    category = button.dataset.category;
    for (const item of buttons) item.setAttribute("aria-pressed", String(item === button));
    render();
  });
  input.addEventListener("input", render);
  render();
})();
