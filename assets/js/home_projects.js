(function () {
  const rail = document.getElementById("featuredProjectGrid");
  const previous = document.getElementById("projectRailPrevious");
  const next = document.getElementById("projectRailNext");
  const status = document.getElementById("projectRailStatus");
  if (!rail || !previous || !next || !status) return;

  const cards = () => Array.from(rail.querySelectorAll(".home-project-card"));

  function visibleRange() {
    const items = cards();
    if (!items.length) return { first: 0, last: 0, total: 0 };
    const railBounds = rail.getBoundingClientRect();
    const visible = items
      .map((card, index) => ({ index, bounds: card.getBoundingClientRect() }))
      .filter((card) => card.bounds.right > railBounds.left + 8 && card.bounds.left < railBounds.right - 8);
    return {
      first: (visible[0]?.index ?? 0) + 1,
      last: (visible.at(-1)?.index ?? 0) + 1,
      total: items.length,
    };
  }

  function updateControls() {
    const range = visibleRange();
    status.textContent = range.first === range.last
      ? `${range.first} / ${range.total}`
      : `${range.first}–${range.last} / ${range.total}`;
    previous.disabled = rail.scrollLeft <= 4;
    next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
  }

  function move(direction) {
    const firstCard = cards()[0];
    if (!firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (firstCard.offsetWidth + gap), behavior: "smooth" });
  }

  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  rail.addEventListener("scroll", updateControls, { passive: true });
  rail.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  });

  if ("ResizeObserver" in window) new ResizeObserver(updateControls).observe(rail);
  window.addEventListener("load", updateControls, { once: true });
  updateControls();
})();
