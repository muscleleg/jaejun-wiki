(() => {
  const buttons = [...document.querySelectorAll("[data-blog-filter]")];
  const posts = [...document.querySelectorAll("[data-blog-tags]")];
  const status = document.querySelector("#curatedBlogFilterStatus");
  const pagination = document.querySelector("#curatedBlogPagination");
  if (!buttons.length || !posts.length || !pagination) return;

  const availableFilters = new Set(buttons.map((button) => button.dataset.blogFilter));
  const pageSize = Number(pagination.dataset.pageSize) || 10;
  const pageGroupSize = Number(pagination.dataset.pageGroupSize) || 10;
  let activeTagId = "all";
  let currentPage = 1;

  function matchingPosts() {
    return posts.filter((post) => {
      const tagIds = new Set((post.dataset.blogTags || "").split(/\s+/).filter(Boolean));
      return activeTagId === "all" || tagIds.has(activeTagId);
    });
  }

  function pageButton(label, page, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `curated-blog-page-button${options.move ? " curated-blog-page-move" : ""}${options.active ? " is-active" : ""}`;
    button.dataset.blogPage = String(page);
    button.textContent = label;
    if (options.label) button.setAttribute("aria-label", options.label);
    if (options.active) button.setAttribute("aria-current", "page");
    button.disabled = Boolean(options.disabled);
    return button;
  }

  function renderPagination(totalPages) {
    pagination.replaceChildren();
    pagination.append(pageButton("이전", "previous", {
      move: true,
      label: "이전 페이지",
      disabled: currentPage === 1,
    }));

    const numberGroup = document.createElement("span");
    numberGroup.className = "curated-blog-page-numbers";
    const groupStart = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);
    for (let page = groupStart; page <= groupEnd; page += 1) {
      numberGroup.append(pageButton(String(page), page, {
        active: page === currentPage,
        label: `${page}페이지`,
      }));
    }
    pagination.append(numberGroup);
    pagination.append(pageButton("다음", "next", {
      move: true,
      label: "다음 페이지",
      disabled: currentPage === totalPages,
    }));
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    if (activeTagId === "all") url.searchParams.delete("tag");
    else url.searchParams.set("tag", activeTagId);
    if (currentPage === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(currentPage));
    window.history.pushState({ blogTag: activeTagId, blogPage: currentPage }, "", url);
  }

  function render(updateHistory = true) {
    const matches = matchingPosts();
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const pageStart = (currentPage - 1) * pageSize;
    const visiblePosts = new Set(matches.slice(pageStart, pageStart + pageSize));

    for (const post of posts) post.hidden = !visiblePosts.has(post);

    for (const button of buttons) {
      const active = button.dataset.blogFilter === activeTagId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    const activeButton = buttons.find((button) => button.dataset.blogFilter === activeTagId);
    if (status) {
      const label = activeTagId === "all" ? "전체" : activeButton.textContent;
      status.textContent = `${label} ${matches.length}편 · ${currentPage}/${totalPages}페이지`;
    }

    renderPagination(totalPages);
    if (updateHistory) updateUrl();
  }

  function restoreFromUrl() {
    const url = new URL(window.location.href);
    const requestedTagId = url.searchParams.get("tag") || "all";
    const requestedPage = Number.parseInt(url.searchParams.get("page") || "1", 10);
    activeTagId = availableFilters.has(requestedTagId) ? requestedTagId : "all";
    currentPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    render(false);
  }

  for (const button of buttons) {
    button.addEventListener("click", () => {
      activeTagId = button.dataset.blogFilter;
      currentPage = 1;
      render();
    });
  }

  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-blog-page]");
    if (!button || button.disabled) return;
    const destination = button.dataset.blogPage;
    if (destination === "previous") currentPage -= 1;
    else if (destination === "next") currentPage += 1;
    else currentPage = Number.parseInt(destination, 10);
    render();
    document.querySelector("#curated-blog-title")?.focus({ preventScroll: true });
  });

  window.addEventListener("popstate", restoreFromUrl);
  restoreFromUrl();
})();
