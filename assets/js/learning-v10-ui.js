(() => {
  const panels = [...document.querySelectorAll("[data-learning-v10-goal-panel]")];
  const requestedGoal = new URLSearchParams(location.search).get("goal") || "";
  const goal = panels.some((panel) => panel.getAttribute("data-learning-v10-goal-panel") === requestedGoal) ? requestedGoal : "";
  const contextualize = (href, linkGoal) => {
    try {
      const url = new URL(href, location.href);
      if (linkGoal) url.searchParams.set("goal", linkGoal);
      else url.searchParams.delete("goal");
      return url.pathname + url.search + url.hash;
    } catch { return href; }
  };
  const applyGoal = () => {
    panels.forEach((panel) => { panel.hidden = Boolean(goal) && panel.getAttribute("data-learning-v10-goal-panel") !== goal; });
    document.querySelectorAll("[data-learning-v10-context-link]").forEach((link) => {
      const baseHref = link.dataset.learningV10BaseHref || link.getAttribute("href") || "";
      link.dataset.learningV10BaseHref = baseHref;
      const card = link.closest("[data-learning-v10-goal-card]");
      const linkGoal = card?.getAttribute("data-learning-v10-goal-card") || link.closest("[data-learning-v10-goal-panel]")?.getAttribute("data-learning-v10-goal-panel") || goal;
      link.setAttribute("href", contextualize(baseHref, linkGoal));
    });
  };
  applyGoal();
  const scrollToRecent = (scroller) => {
    const recorded = [...scroller.querySelectorAll(".learning-v10-grass-cell.has-records")];
    const recent = recorded.at(-1);
    if (!recent) return;
    scroller.scrollLeft = Math.max(0, recent.offsetLeft + recent.offsetWidth - scroller.clientWidth + 16);
  };
  const yearSelect = document.querySelectorAll("[data-learning-v10-history-year]")[0];
  if (yearSelect) {
    const calendars = [...document.querySelectorAll("[data-calendar-year]")];
    const initializedYears = new Set();
    const showYear = (year, scroll) => {
      if (!calendars.some((calendar) => calendar.getAttribute("data-calendar-year") === year)) return;
      yearSelect.value = year;
      calendars.forEach((calendar) => {
        calendar.hidden = calendar.getAttribute("data-calendar-year") !== year;
        if (!calendar.hidden && scroll && !initializedYears.has(year)) {
          calendar.querySelectorAll(".learning-v10-calendar-scroll").forEach(scrollToRecent);
        }
      });
      initializedYears.add(year);
    };
    const followDateFragment = () => {
      const match = (location.hash || "").match(/^#learning-v10-history-day-(\d{4})-/);
      if (match) showYear(match[1], false);
    };
    showYear(yearSelect.value, !(location.hash || "").startsWith("#learning-v10-history-day-"));
    followDateFragment();
    yearSelect.disabled = false;
    yearSelect.addEventListener("change", () => showYear(yearSelect.value, true));
    window.addEventListener("hashchange", followDateFragment);
  } else if (!(location.hash || "").startsWith("#learning-v10-history-day-")) {
    document.querySelectorAll(".learning-v10-calendar-scroll").forEach(scrollToRecent);
  }
  const grassCells = [...document.querySelectorAll("[data-learning-v10-grass-tooltip]")];
  if (grassCells.length) {
    const tooltip = document.createElement("div");
    tooltip.className = "learning-v10-grass-tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    const hide = () => { tooltip.hidden = true; };
    const show = (cell) => {
      tooltip.textContent = cell.getAttribute("data-learning-v10-grass-tooltip");
      tooltip.hidden = false;
      const rect = cell.getBoundingClientRect();
      const box = tooltip.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.left + rect.width / 2 - box.width / 2, window.innerWidth - box.width - 8));
      const top = rect.top >= box.height + 16 ? rect.top - box.height - 8 : rect.bottom + 8;
      tooltip.style.left = left + "px";
      tooltip.style.top = top + "px";
    };
    grassCells.forEach((cell) => {
      // Keep native titles as a no-JS fallback, without two competing tooltips.
      cell.removeAttribute("title");
      cell.addEventListener("pointerenter", () => show(cell));
      cell.addEventListener("pointerleave", hide);
      cell.addEventListener("focus", () => show(cell));
      cell.addEventListener("blur", hide);
      cell.addEventListener("click", hide);
    });
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") hide(); });
  }
  document.querySelectorAll("[data-learning-v10-copy-request]").forEach((button) => {
    button.addEventListener("click", async () => {
      const request = button.getAttribute("data-learning-v10-copy-request") || "";
      try { await navigator.clipboard.writeText(request); button.dataset.copyState = "copied"; button.textContent = "복사됨"; }
      catch { button.dataset.copyState = "failed"; button.textContent = "복사할 수 없음"; }
    });
  });
})();