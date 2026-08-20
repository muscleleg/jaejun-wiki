(() => {
  if (!location.pathname.includes("/wiki/") || location.pathname.endsWith("/wiki.html")) return;
  if (document.querySelector('nav[aria-label*="문서 목차"], .toc')) return;

  const levelTwoHeadings = [...document.querySelectorAll("main section h2, .content section h2")];
  const headings = levelTwoHeadings.length >= 4
    ? levelTwoHeadings
    : [...document.querySelectorAll("main section h2, main section h3, .content section h2, .content section h3")];
  if (headings.length < 4) return;
  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `document-section-${index + 1}`;
  });

  const firstSection = document.querySelector("main section, .content section");
  if (!firstSection) return;

  const toc = document.createElement("details");
  toc.className = "auto-article-toc";
  if (matchMedia("(min-width: 821px)").matches) toc.open = true;
  toc.innerHTML = '<summary>이 문서의 내용</summary><nav aria-label="자동 문서 목차"></nav>';
  const navigation = toc.querySelector("nav");

  for (const heading of headings) {
    const link = document.createElement("a");
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    if (heading.tagName === "H3") link.dataset.level = "3";
    navigation.appendChild(link);
  }

  firstSection.before(toc);

  const links = new Map([...navigation.querySelectorAll("a")].map((link) => [link.hash.slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    for (const link of links.values()) link.removeAttribute("aria-current");
    links.get(visible.target.id)?.setAttribute("aria-current", "location");
  }, { rootMargin: "-18% 0px -70% 0px" });
  headings.forEach((heading) => observer.observe(heading));
})();
