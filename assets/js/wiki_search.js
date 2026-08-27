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
  const expandedRootHrefs = new Set();
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
  filters.replaceChildren();
  filters.append(...buttons);
  const categoryIds = new Set(buttons
    .map((button) => button.dataset.category)
    .filter((id) => id && id !== "all"));

  function categoryFromHash(hash = location.hash) {
    if (!hash || hash === "#wiki-discovery") return null;
    const decoded = decodeURIComponent(hash.slice(1));
    const id = decoded.startsWith("wiki-category-")
      ? decoded.slice("wiki-category-".length)
      : decoded;
    return categoryIds.has(id) ? id : null;
  }

  function syncCategoryButtons() {
    for (const item of buttons) {
      item.setAttribute("aria-pressed", String(item.dataset.category === category));
    }
  }

  function scrollToVisibleCategory(categoryId) {
    requestAnimationFrame(() => {
      const target = document.getElementById(`wiki-category-${categoryId}`);
      if (target && !target.hidden) target.scrollIntoView({ block: "start" });
    });
  }

  function activateCategory(categoryId, { updateHash = false, scroll = true } = {}) {
    category = categoryId;
    input.value = "";
    syncCategoryButtons();
    render();
    if (updateHash && location.hash !== `#${categoryId}`) {
      history.pushState(null, "", `#${categoryId}`);
    }
    if (scroll) scrollToVisibleCategory(categoryId);
  }

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

  function depthInCategory(entry, groupKey) {
    return Math.max(0, hierarchy(entry).filter((item) => item.categoryKey === groupKey).length - 1);
  }

  function groupByRoot(entries, groupKey) {
    const roots = [];
    for (const entry of entries) {
      const depth = depthInCategory(entry, groupKey);
      if (!roots.length || depth === 0) roots.push({ root: entry, descendants: [] });
      else roots.at(-1).descendants.push(entry);
    }
    return roots;
  }

  function setToggleState(button, children, expanded) {
    const count = Number(button.dataset.childCount || 0);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = `하위 문서 ${count}개 ${expanded ? "접기" : "펼치기"}`;
    children.hidden = !expanded;
  }

  function createRootGroup(rootGroup, directMatchHrefs, groupKey, forceExpanded) {
    const wrapper = document.createElement("div");
    wrapper.className = "wiki-tree-root";
    const row = document.createElement("div");
    row.className = "wiki-tree-root-row";
    row.appendChild(createDocumentLink(rootGroup.root, directMatchHrefs, groupKey));

    if (rootGroup.descendants.length) {
      const childId = `wiki-children-${rootGroup.root.id}`;
      const children = document.createElement("div");
      children.className = "wiki-tree-children";
      children.id = childId;
      for (const entry of rootGroup.descendants) {
        children.appendChild(createDocumentLink(entry, directMatchHrefs, groupKey));
      }

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "wiki-tree-toggle";
      toggle.dataset.rootKey = rootGroup.root.href;
      toggle.dataset.childCount = String(rootGroup.descendants.length);
      toggle.setAttribute("aria-controls", childId);
      const expanded = forceExpanded || expandedRootHrefs.has(rootGroup.root.href);
      setToggleState(toggle, children, expanded);
      row.appendChild(toggle);
      wrapper.append(row, children);
    } else {
      wrapper.appendChild(row);
    }
    return wrapper;
  }

  function render() {
    const query = input.value.trim().toLocaleLowerCase("ko");
    const searching = Boolean(query);
    const filtered = Boolean(searching || category !== "all");
    const directMatches = manifest.documents.filter((entry) => {
      const categoryMatch = category === "all" || entry.categoryKey === category;
      const haystack = `${entry.title} ${entry.description} ${entry.searchText || ""} ${entry.category}`.toLocaleLowerCase("ko");
      return categoryMatch && (!query || haystack.includes(query));
    });
    const directMatchHrefs = new Set(directMatches.map((entry) => entry.href));
    const visibleHrefs = new Set(directMatchHrefs);
    if (searching) directMatches.forEach((entry) => addAncestors(entry, visibleHrefs));

    for (const [id, section] of legacySectionById) {
      section.id = `wiki-legacy-${id}`;
    }
    results.replaceChildren();
    results.hidden = false;
    categorySections.forEach((section) => { section.hidden = true; });

    if (!directMatches.length) {
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

    const rootCount = orderedGroups.reduce((count, [groupKey, group]) => (
      count + groupByRoot(group.entries, groupKey).length
    ), 0);
    if (searching) {
      const contextCount = visibleHrefs.size - directMatches.length;
      status.textContent = `${directMatches.length}개 문서를 찾았습니다.${contextCount ? ` 문서 위치를 보여주기 위해 상위 문서 ${contextCount}개도 함께 표시합니다.` : ""}`;
    } else if (category === "all") {
      status.textContent = `전체 ${manifest.indexedCount || manifest.documents.length}개 문서 중 최상위 ${rootCount}개를 표시합니다. 하위 문서는 문서별 펼치기 버튼으로 확인할 수 있습니다.`;
    } else {
      status.textContent = `${directMatches.length}개 문서 중 최상위 ${rootCount}개를 표시합니다. 하위 문서는 문서별 펼치기 버튼으로 확인할 수 있습니다.`;
    }

    for (const [groupKey, group] of orderedGroups) {
      const section = document.createElement("section");
      section.className = "wiki-tree-category";
      section.dataset.category = groupKey;
      section.id = `wiki-category-${groupKey}`;
      const fragmentAnchor = document.createElement("span");
      fragmentAnchor.id = groupKey;
      fragmentAnchor.className = "wiki-category-anchor";
      fragmentAnchor.setAttribute("aria-hidden", "true");
      const heading = document.createElement("h3");
      const count = document.createElement("span");
      const matchCount = group.entries.filter((entry) => directMatchHrefs.has(entry.href)).length;
      heading.textContent = group.label;
      count.textContent = `${filtered ? matchCount : group.entries.length}개`;
      heading.append(count);
      const list = document.createElement("div");
      list.className = "wiki-tree-list";
      for (const rootGroup of groupByRoot(group.entries, groupKey)) {
        list.appendChild(createRootGroup(rootGroup, directMatchHrefs, groupKey, searching));
      }
      section.append(fragmentAnchor, heading, list);
      results.appendChild(section);
    }
  }

  results.addEventListener("click", (event) => {
    const button = event.target.closest("button.wiki-tree-toggle");
    if (!button) return;
    const children = document.getElementById(button.getAttribute("aria-controls"));
    if (!children) return;
    const expanded = button.getAttribute("aria-expanded") !== "true";
    if (expanded) expandedRootHrefs.add(button.dataset.rootKey);
    else expandedRootHrefs.delete(button.dataset.rootKey);
    setToggleState(button, children, expanded);
  });

  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-category]");
    if (!button) return;
    category = button.dataset.category;
    syncCategoryButtons();
    render();
  });
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link) return;
    const categoryId = categoryFromHash(link.getAttribute("href"));
    if (!categoryId) return;
    event.preventDefault();
    activateCategory(categoryId, { updateHash: true });
  });
  window.addEventListener("hashchange", () => {
    const categoryId = categoryFromHash();
    if (categoryId) activateCategory(categoryId);
  });
  input.addEventListener("input", render);
  const initialCategory = categoryFromHash();
  if (initialCategory) activateCategory(initialCategory, { scroll: true });
  else render();
})();
