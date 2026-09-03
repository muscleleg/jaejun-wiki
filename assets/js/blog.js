(() => {
  const buttons = [...document.querySelectorAll("[data-blog-filter]")];
  const posts = [...document.querySelectorAll("[data-blog-tags]")];
  const status = document.querySelector("#curatedBlogFilterStatus");
  const pagination = document.querySelector("#curatedBlogPagination");
  if (!buttons.length || !posts.length || !pagination) return;

  const pageButtons = [...pagination.querySelectorAll("[data-blog-page]")];
  const previous = pageButtons.find((button) => button.dataset.blogPage === "previous");
  const next = pageButtons.find((button) => button.dataset.blogPage === "next");
  const numbered = pageButtons.filter((button) => /^\d+$/.test(button.dataset.blogPage));
  const availableFilters = new Set(buttons.map((button) => button.dataset.blogFilter));
  const pageSize = Number(pagination.dataset.pageSize) || 10;
  const pageGroupSize = Number(pagination.dataset.pageGroupSize) || 10;
  let activeTagId = "all";
  let currentPage = 1;

  const matchingPosts = () => posts.filter((post) => {
    const tagIds = new Set((post.dataset.blogTags || "").split(/\s+/).filter(Boolean));
    return activeTagId === "all" || tagIds.has(activeTagId);
  });

  function updateUrl() {
    const url = new URL(window.location.href);
    if (activeTagId === "all") url.searchParams.delete("tag");
    else url.searchParams.set("tag", activeTagId);
    if (currentPage === 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(currentPage));
    history.pushState(null, "", url);
  }

  function render(updateHistory = true) {
    const matches = matchingPosts();
    const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), totalPages);
    const visible = new Set(matches.slice((currentPage - 1) * pageSize, currentPage * pageSize));
    const groupStart = Math.floor((currentPage - 1) / pageGroupSize) * pageGroupSize + 1;
    const groupEnd = Math.min(totalPages, groupStart + pageGroupSize - 1);
    posts.forEach((post) => { post.hidden = !visible.has(post); });
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.blogFilter === activeTagId)));
    numbered.forEach((button) => {
      const page = Number(button.dataset.blogPage);
      button.hidden = page > totalPages || page < groupStart || page > groupEnd;
      button.classList.toggle("is-active", page === currentPage);
      if (page === currentPage) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    if (previous) previous.disabled = currentPage === 1;
    if (next) next.disabled = currentPage === totalPages;
    const label = activeTagId === "all" ? "전체" : buttons.find((button) => button.dataset.blogFilter === activeTagId)?.textContent;
    if (status) status.textContent = `${label} ${matches.length}편 · ${currentPage}/${totalPages}페이지`;
    if (updateHistory) updateUrl();
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    activeTagId = button.dataset.blogFilter;
    currentPage = 1;
    render();
  }));
  pagination.addEventListener("click", (event) => {
    const button = event.target.closest("[data-blog-page]");
    if (!button || button.disabled) return;
    if (button.dataset.blogPage === "previous") currentPage -= 1;
    else if (button.dataset.blogPage === "next") currentPage += 1;
    else currentPage = Number(button.dataset.blogPage);
    render();
  });
  function restore() {
    const url = new URL(location.href);
    const tag = url.searchParams.get("tag") || "all";
    activeTagId = availableFilters.has(tag) ? tag : "all";
    currentPage = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    render(false);
  }
  addEventListener("popstate", restore);
  restore();
})();
