(() => {
  if (!location.pathname.includes("/wiki/") || location.pathname.endsWith("/wiki.html")) return;
  if (document.querySelector(".document-toc")) return;

  const existingToc = document.querySelector(
    'nav.source-nav, nav[aria-label*="문서 목차"], nav[aria-label*="개념 목차"], aside.toc'
  );
  const headingScope = document.querySelector("main, .page.layout main, article.content, .content") || document.body;
  const levelTwoHeadings = [...headingScope.querySelectorAll("section h2")];
  const headings = levelTwoHeadings.length >= 2
    ? levelTwoHeadings
    : [...headingScope.querySelectorAll("section h2, section h3")];

  if (!existingToc && headings.length < 2) return;

  headings.forEach((heading, index) => {
    if (!heading.id) heading.id = `document-section-${index + 1}`;
  });

  const navigation = existingToc || document.createElement("nav");
  navigation.classList.add("document-toc-links");
  if (!navigation.hasAttribute("aria-label")) navigation.setAttribute("aria-label", "문서 목차");

  if (!existingToc) {
    for (const heading of headings) {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      if (heading.tagName === "H3") link.dataset.level = "3";
      navigation.appendChild(link);
    }
  }

  const nativeLayout = navigation.closest(".page.layout");
  const toc = document.createElement("details");
  toc.className = "document-toc";
  toc.open = matchMedia("(min-width: 821px)").matches;
  const summary = document.createElement("summary");
  summary.textContent = "이 문서의 내용";
  toc.append(summary);

  if (nativeLayout) {
    navigation.replaceWith(toc);
    toc.append(navigation);
    nativeLayout.classList.add("document-toc-layout");
  } else {
    toc.append(navigation);
    const container = document.querySelector("main.wrap, main.page-shell, main.page");
    if (container) {
      const header = container.querySelector(":scope > header");
      const breadcrumb = container.querySelector(":scope > .breadcrumb");
      const insertAfter = header || breadcrumb;
      if (insertAfter) insertAfter.after(toc);
      else container.prepend(toc);
      container.classList.add("document-toc-layout");
    } else {
      const firstSection = document.querySelector("main section, .content section");
      if (!firstSection) return;
      firstSection.before(toc);
      toc.classList.add("document-toc-inline");
    }
  }

  const links = new Map(
    [...navigation.querySelectorAll('a[href^="#"]')]
      .map((link) => [decodeURIComponent(link.hash.slice(1)), link])
  );
  const observedHeadings = headings.filter((heading) => links.has(heading.id));
  if (!("IntersectionObserver" in window) || observedHeadings.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (!visible) return;
    for (const link of links.values()) link.removeAttribute("aria-current");
    links.get(visible.target.id)?.setAttribute("aria-current", "location");
  }, { rootMargin: "-18% 0px -70% 0px" });
  observedHeadings.forEach((heading) => observer.observe(heading));
})();
