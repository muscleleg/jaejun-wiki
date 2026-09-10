(function () {
  const section = document.getElementById("home-learning");
  const rail = section?.querySelector("[data-home-learning-rail]");
  if (!rail) return;
  const nodes = Array.from(rail.querySelectorAll(".learning-v10-path-node"));
  if (!nodes.length) return;
  const previous = section.querySelector("[data-home-learning-previous]");
  const next = section.querySelector("[data-home-learning-next]");
  const position = section.querySelector("[data-home-learning-position]");
  const toggles = Array.from(section.querySelectorAll("[data-learning-path-toggle]"));
  const panels = Array.from(section.querySelectorAll("[data-home-learning-panel]"));
  const current = nodes.find(node => node.classList.contains("is-active"));
  let interacted = false;
  let width = 0;
  let step = 0;
  let openedBy = null;
  let frame = 0;

  const behavior = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  const rawCenterOf = node => {
    const box = node.getBoundingClientRect();
    return rail.scrollLeft + box.left - rail.getBoundingClientRect().left + box.width / 2 - rail.clientWidth / 2;
  };
  const maxScroll = () => Math.max(0, rail.scrollWidth - rail.clientWidth);
  const scrollTargets = () => {
    const maximum = maxScroll();
    if (!maximum || nodes.length === 1) return nodes.map(() => 0);
    const raw = nodes.map(rawCenterOf);
    const firstCentered = raw.findIndex(value => value > 0);
    let lastCentered = raw.length - 1;
    while (lastCentered >= 0 && raw[lastCentered] >= maximum) lastCentered -= 1;
    return raw.map((value, index) => {
      if (firstCentered > 0 && index < firstCentered) {
        return raw[firstCentered] * index / firstCentered;
      }
      if (lastCentered >= 0 && lastCentered < nodes.length - 1 && index > lastCentered) {
        const remaining = nodes.length - 1 - lastCentered;
        return raw[lastCentered] + (maximum - raw[lastCentered]) * (index - lastCentered) / remaining;
      }
      return Math.max(0, Math.min(maximum, value));
    });
  };
  const nearest = () => {
    const targets = scrollTargets();
    return targets.reduce((best, target, index) => {
      const distance = Math.abs(target - rail.scrollLeft);
      return distance < best.distance ? { index, distance } : best;
    }, { index: 0, distance: Infinity }).index;
  };

  function updateControls() {
    const index = nearest();
    position.textContent = `${index + 1} / ${nodes.length}`;
    previous.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
  }

  function layout() {
    const nextWidth = rail.clientWidth;
    if (!nextWidth || nextWidth === width) return;
    const offset = rail.scrollLeft;
    const nextStep = nodes.length > 1
      ? nodes[1].getBoundingClientRect().left - nodes[0].getBoundingClientRect().left
      : nodes[0].getBoundingClientRect().width;
    width = nextWidth;
    if (!interacted) {
      const index = Math.max(0, nodes.indexOf(current || nodes[0]));
      rail.scrollTo({ left: scrollTargets()[index], behavior: "instant" });
    }
    else rail.scrollTo({ left: step ? offset * nextStep / step : offset, behavior: "instant" });
    step = nextStep;
    updateControls();
  }

  function move(direction) {
    interacted = true;
    const index = Math.max(0, Math.min(nodes.length - 1, nearest() + direction));
    rail.scrollTo({ left: scrollTargets()[index], behavior: behavior() });
  }

  function closePanel(returnFocus = false) {
    const prior = openedBy;
    panels.forEach(panel => { panel.hidden = true; });
    toggles.forEach(toggle => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.querySelector("span").textContent = "＋";
    });
    openedBy = null;
    if (returnFocus) prior?.focus({ preventScroll: true });
  }

  toggles.forEach(toggle => {
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      interacted = true;
      const wasOpen = toggle === openedBy;
      closePanel();
      if (wasOpen) return;
      const panel = panels.find(item => item.id === toggle.getAttribute("aria-controls"));
      if (!panel) return;
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      toggle.querySelector("span").textContent = "−";
      openedBy = toggle;
      panel.querySelector("[data-home-learning-close]").focus({ preventScroll: true });
    });
  });
  section.querySelectorAll("[data-home-learning-close]").forEach(button => button.addEventListener("click", () => closePanel(true)));
  section.addEventListener("keydown", event => {
    if (event.key === "Escape" && openedBy) { event.preventDefault(); closePanel(true); }
  });
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  rail.addEventListener("keydown", event => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      interacted = true;
      if (event.key === "Home" || event.key === "End") {
        rail.scrollTo({ left: event.key === "Home" ? 0 : maxScroll(), behavior: behavior() });
      } else move(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  for (const type of ["wheel", "pointerdown", "touchstart"]) rail.addEventListener(type, () => { interacted = true; }, { passive: true });
  rail.addEventListener("focusin", () => { interacted = true; });
  rail.addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updateControls);
  }, { passive: true });
  section.querySelector(".home-learning-navigation").hidden = false;
  if ("ResizeObserver" in window) new ResizeObserver(layout).observe(rail);
  else window.addEventListener("resize", layout);
  // Layout is independent of viewport visibility and never moves the page vertically.
  layout();
})();
