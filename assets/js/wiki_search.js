(() => {
  const manifest = window.KNOWLEDGE_MANIFEST;
  const root = document.getElementById("wiki-discovery");
  if (!manifest || !root) return;

  const input = root.querySelector("input[type='search']");
  const filters = root.querySelector(".wiki-category-filters");
  const results = root.querySelector(".wiki-search-results");
  const status = root.querySelector(".wiki-search-status");
  const categorySections = [...document.querySelectorAll("main.wrap > section")]
    .filter((section) => section !== root);
  const legacySectionById = new Map(categorySections
    .filter((section) => section.id)
    .map((section) => [section.id, section]));
  const documentByHref = new Map(manifest.documents.map((entry) => [entry.href, entry]));
  const hierarchyByHref = new Map();
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

  function hierarchy(entry) {
    if (hierarchyByHref.has(entry.href)) return hierarchyByHref.get(entry.href);
    const chain = [];
    const seen = new Set();
    let current = entry;
    while (current && !seen.has(current.href)) {
      chain.unshift(current);
      seen.add(current.href);
      current = current.parentHref ? documentByHref.get(current.parentHref) : null;
    }
    hierarchyByHref.set(entry.href, chain);
    return chain;
  }

  function compareHierarchy(left, right) {
    const leftPath = hierarchy(left);
    const rightPath = hierarchy(right);
    for (let index = 0; index < Math.max(leftPath.length, rightPath.length); index += 1) {
      if (!leftPath[index]) return -1;
      if (!rightPath[index]) return 1;
      const compared = leftPath[index].title.localeCompare(rightPath[index].title, "ko");
      if (compared) return compared;
    }
    return 0;
  }

  function addAncestors(entry, visibleHrefs) {
    for (const ancestor of hierarchy(entry)) visibleHrefs.add(ancestor.href);
  }

  function createDocumentLink(entry, directMatchHrefs, groupKey) {
    const path = hierarchy(entry);
    const parent = path.at(-2);
    const depth = Math.max(0, path.filter((item) => item.categoryKey === groupKey).length - 1);
    const link = document.createElement("a");
    link.className = "wiki-link wiki-search-result";
    if (depth > 0) link.classList.add("wiki-search-child");
    if (!directMatchHrefs.has(entry.href)) link.classList.add("wiki-search-context");
    link.style.setProperty("--wiki-depth", String(Math.min(depth, 4)));
    link.dataset.depth = String(depth);
    link.href = entry.href;

    const meta = document.createElement("em");
    meta.textContent = parent
      ? `${entry.category} · ${parent.title}의 하위 문서`
      : `${entry.category} · 상위 문서`;
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const description = document.createElement("span");
    description.textContent = entry.description || "연결된 학습 문서";
    link.append(meta, title, description);
    return link;
  }

  function render() {
    const query = input.value.trim().toLocaleLowerCase("ko");
    const filtered = Boolean(query || category !== "all");
    const directMatches = manifest.documents.filter((entry) => {
      const categoryMatch = category === "all" || entry.categoryKey === category;
      const haystack = `${entry.title} ${entry.description} ${entry.searchText || ""} ${entry.category}`.toLocaleLowerCase("ko");
      return categoryMatch && (!query || haystack.includes(query));
    });
    const directMatchHrefs = new Set(directMatches.map((entry) => entry.href));
    const visibleHrefs = new Set(directMatchHrefs);
    if (filtered) directMatches.forEach((entry) => addAncestors(entry, visibleHrefs));

    for (const [id, section] of legacySectionById) section.id = id;
    results.replaceChildren();
    results.hidden = false;
    categorySections.forEach((section) => { section.hidden = true; });

    if (!filtered) {
      status.textContent = `전체 ${manifest.indexedCount || manifest.documents.length}개 문서를 상위 문서부터 하위 문서 순서로 표시합니다.`;
    } else if (directMatches.length) {
      const contextCount = visibleHrefs.size - directMatches.length;
      status.textContent = `${directMatches.length}개 문서를 찾았습니다.${contextCount ? ` 문서 위치를 보여주기 위해 상위 문서 ${contextCount}개도 함께 표시합니다.` : ""}`;
    } else {
      status.textContent = "조건에 맞는 문서가 없습니다.";
      return;
    }

    const visibleEntries = manifest.documents
      .filter((entry) => visibleHrefs.has(entry.href))
      .sort(compareHierarchy);
    const groups = new Map();
    for (const entry of visibleEntries) {
      const groupKey = entry.categoryKey;
      if (!groups.has(groupKey)) groups.set(groupKey, { label: entry.category, entries: [] });
      groups.get(groupKey).entries.push(entry);
    }

    const categoryOrder = new Map(manifest.categories.map((item, index) => [item.id, index]));
    const orderedGroups = [...groups.entries()].sort(([leftKey, left], [rightKey, right]) => {
      const order = (categoryOrder.get(leftKey) ?? 999) - (categoryOrder.get(rightKey) ?? 999);
      return order || left.label.localeCompare(right.label, "ko");
    });

    for (const [groupKey, group] of orderedGroups) {
      const section = document.createElement("section");
      section.className = "wiki-tree-category";
      section.dataset.category = groupKey;
      const legacySection = legacySectionById.get(groupKey);
      if (legacySection) {
        legacySection.removeAttribute("id");
        section.id = groupKey;
      }
      const heading = document.createElement("h3");
      const count = document.createElement("span");
      const matchCount = group.entries.filter((entry) => directMatchHrefs.has(entry.href)).length;
      heading.textContent = group.label;
      count.textContent = `${filtered ? matchCount : group.entries.length}개`;
      heading.append(count);
      const list = document.createElement("div");
      list.className = "wiki-tree-list";
      for (const entry of group.entries) list.appendChild(createDocumentLink(entry, directMatchHrefs, groupKey));
      section.append(heading, list);
      results.appendChild(section);
    }
  }

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    category = button.dataset.category;
    for (const item of buttons) item.setAttribute("aria-pressed", String(item === button));
    render();
  });
  const projectsLink = document.querySelector("a[href='#projects']");
  if (projectsLink) {
    projectsLink.addEventListener("click", (event) => {
      event.preventDefault();
      category = "projects";
      input.value = "";
      for (const item of buttons) {
        item.setAttribute("aria-pressed", String(item.dataset.category === category));
      }
      render();
      document.getElementById("projects")?.scrollIntoView();
    });
  }
  input.addEventListener("input", render);
  render();
})();
