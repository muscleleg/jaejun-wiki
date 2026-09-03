(() => {
  const toc = document.querySelector(".document-toc");
  if (!toc) return;
  if (matchMedia("(min-width: 821px)").matches) toc.open = true;

  const links = new Map(
    [...toc.querySelectorAll('a[href^="#"]')]
      .map((link) => [decodeURIComponent(link.hash.slice(1)), link]),
  );
  const headings = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!("IntersectionObserver" in window) || !headings.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
    if (!visible) return;
    for (const link of links.values()) link.removeAttribute("aria-current");
    links.get(visible.target.id)?.setAttribute("aria-current", "location");
  }, { rootMargin: "-18% 0px -70% 0px" });
  headings.forEach((heading) => observer.observe(heading));
})();
