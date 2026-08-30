(function () {
  const dashboard = document.querySelector("[data-review-dashboard]");
  const list = document.getElementById("reviewQueueItems");
  if (!dashboard || !list) return;

  const dateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = dateString(new Date());
  const maxPerSession = Number(dashboard.dataset.maxPerSession || 3);
  const cards = Array.from(list.querySelectorAll("[data-review-id]"));
  const outcomeRank = (card) => ({ failed: 0, hinted: 1 }[card.dataset.lastOutcome] ?? 2);
  const dueCards = cards
    .filter((card) => card.dataset.nextDue <= today)
    .sort((left, right) => {
      const byOutcome = outcomeRank(left) - outcomeRank(right);
      const byPriority = Number(left.dataset.priority || 99) - Number(right.dataset.priority || 99);
      return byOutcome || byPriority || left.dataset.nextDue.localeCompare(right.dataset.nextDue);
    });
  const upcomingCards = cards
    .filter((card) => card.dataset.nextDue > today)
    .sort((left, right) => left.dataset.nextDue.localeCompare(right.dataset.nextDue));

  const sessionCards = dueCards.slice(0, maxPerSession);
  const sessionCardSet = new Set(sessionCards);
  const overflowCards = dueCards.filter((card) => !sessionCardSet.has(card));

  [...sessionCards, ...overflowCards, ...upcomingCards].forEach((card) => list.appendChild(card));

  dueCards.forEach((card) => {
    card.classList.add("is-due");
    card.classList.toggle("is-session-active", sessionCardSet.has(card));
    card.classList.toggle("is-overflow", !sessionCardSet.has(card));
  });

  cards.forEach((card) => {
    const badge = card.querySelector(".review-next-due");
    if (!badge) return;
    const nextDue = card.dataset.nextDue;
    if (nextDue < today) badge.textContent = `기한 지남 · ${nextDue}`;
    else if (nextDue === today) badge.textContent = "오늘 회상";
    else badge.textContent = `예정 · ${nextDue}`;
  });

  const setText = (id, value) => {
    const target = document.getElementById(id);
    if (target) target.textContent = value;
  };
  const attempts = cards.reduce((sum, card) => sum + Number(card.dataset.delayedAttempts || 0), 0);
  const successes = cards.reduce((sum, card) => sum + Number(card.dataset.delayedSuccesses || 0), 0);
  const nextDue = [...cards].map((card) => card.dataset.nextDue).sort()[0];
  const sessionCount = sessionCards.length;

  setText("reviewDueCount", `${dueCards.length}개`);
  setText("reviewSessionCount", `${sessionCount}개`);
  setText("reviewEnrolledCount", `${cards.length}개`);
  setText("reviewDelayedSuccessRate", attempts ? `${Math.round(successes / attempts * 100)}%` : "측정 전");
  setText("reviewNextDue", nextDue || "미정");

  const message = document.getElementById("reviewSessionMessage");
  if (message) {
    if (dueCards.length) {
      message.innerHTML = `<strong>이번 세션 회상 ${sessionCount}개</strong>최근 실패·중요도·밀린 기간을 기준으로 전체 기한 항목 ${dueCards.length}개 중 ${sessionCount}개를 먼저 확인합니다. 남은 항목은 실패 처리하지 않고 다음 세션으로 넘깁니다.`;
    } else {
      message.innerHTML = `<strong>오늘 기한이 된 회상 없음</strong>다음 회상 예정일은 ${nextDue || "아직 정해지지 않았습니다"}입니다. 새 학습은 현재 핵심 관문에서 그대로 이어갑니다.`;
    }
  }

  const prompts = Array.from(list.querySelectorAll(".review-prompt"));
  prompts.forEach((prompt) => {
    prompt.addEventListener("toggle", () => {
      if (!prompt.open) return;
      prompts.forEach((other) => {
        if (other !== prompt) other.open = false;
      });
    });
  });
})();
