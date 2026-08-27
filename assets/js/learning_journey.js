(function () {
  const journeys = Array.from(document.querySelectorAll("[data-outcome-journey]"));

  journeys.forEach((journey) => {
    const milestones = Array.from(journey.querySelectorAll("details"));

    milestones.forEach((milestone) => {
      const summary = milestone.querySelector("summary");
      if (!summary) return;

      summary.addEventListener("click", () => {
        if (milestone.open) milestone.classList.add("suppress-hover");
        else milestone.classList.remove("suppress-hover");
      });

      milestone.addEventListener("toggle", () => {
        if (!milestone.open) return;
        milestones.forEach((other) => {
          if (other !== milestone) other.open = false;
        });
      });

      milestone.addEventListener("mouseleave", () => {
        milestone.classList.remove("suppress-hover");
      });
    });

    journey.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      milestones.forEach((milestone) => {
        milestone.open = false;
        milestone.classList.add("suppress-hover");
      });
    });
  });
})();
