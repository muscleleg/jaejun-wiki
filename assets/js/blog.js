(() => {
  const buttons = [...document.querySelectorAll("[data-blog-filter]")];
  const posts = [...document.querySelectorAll("[data-blog-tags]")];
  const status = document.querySelector("#curatedBlogFilterStatus");
  if (!buttons.length || !posts.length) return;

  const availableFilters = new Set(buttons.map((button) => button.dataset.blogFilter));

  function applyFilter(tagId, updateUrl = true) {
    const activeTagId = availableFilters.has(tagId) ? tagId : "all";
    let visibleCount = 0;

    for (const post of posts) {
      const tagIds = new Set((post.dataset.blogTags || "").split(/\s+/).filter(Boolean));
      const visible = activeTagId === "all" || tagIds.has(activeTagId);
      post.hidden = !visible;
      if (visible) visibleCount += 1;
    }

    for (const button of buttons) {
      const active = button.dataset.blogFilter === activeTagId;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }

    const activeButton = buttons.find((button) => button.dataset.blogFilter === activeTagId);
    if (status) status.textContent = activeTagId === "all" ? `전체 ${visibleCount}편` : `${activeButton.textContent} ${visibleCount}편`;

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (activeTagId === "all") url.searchParams.delete("tag");
      else url.searchParams.set("tag", activeTagId);
      window.history.pushState({ blogTag: activeTagId }, "", url);
    }
  }

  for (const button of buttons) {
    button.addEventListener("click", () => applyFilter(button.dataset.blogFilter));
  }

  window.addEventListener("popstate", () => {
    const tagId = new URL(window.location.href).searchParams.get("tag") || "all";
    applyFilter(tagId, false);
  });

  const initialTagId = new URL(window.location.href).searchParams.get("tag") || "all";
  applyFilter(initialTagId, false);
})();
