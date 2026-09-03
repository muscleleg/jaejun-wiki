(() => {
  const nav = document.querySelector(".global-learning-nav");
  if (!nav) return;

  const currentPath = location.pathname;
  const legacyRecordDestinations = {
    "#deferred-learning": "learning_backlog.html",
    "#review-queue": "learning_review.html",
  };
  if (currentPath.endsWith("/learning_history.html") && legacyRecordDestinations[location.hash]) {
    const rootHref = nav.dataset.projectRoot || "./";
    location.replace(new URL(`${rootHref}${legacyRecordDestinations[location.hash]}`, location.href).href);
    return;
  }

  if (currentPath.includes("/wiki/") && new URLSearchParams(location.search).get("view") === "blog") {
    document.body.classList.add("blog-reading-view");
    nav.querySelectorAll('a[aria-current="page"]').forEach((link) => link.removeAttribute("aria-current"));
    [...nav.querySelectorAll(":scope > a")]
      .find((link) => link.getAttribute("href")?.endsWith("blog.html"))
      ?.setAttribute("aria-current", "page");
  }

  const wrapper = nav.querySelector(".global-learning-nav-record");
  const button = nav.querySelector(".global-learning-nav-record-trigger");
  const menu = nav.querySelector(".global-learning-nav-record-menu");
  if (!wrapper || !button || !menu) return;

  const setOpen = (open, { restoreFocus = false } = {}) => {
    menu.hidden = !open;
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "기록 메뉴 닫기" : "기록 메뉴 열기");
    wrapper.classList.toggle("is-open", open);
    if (restoreFocus) button.focus();
  };

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  button.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    setOpen(true);
    const links = [...menu.querySelectorAll("a")];
    (event.key === "ArrowDown" ? links[0] : links.at(-1))?.focus();
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setOpen(false, { restoreFocus: true });
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      setOpen(false, { restoreFocus: true });
    }
  });
})();
