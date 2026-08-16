(function () {
  const container = document.getElementById("calendar-list");
  if (!container) return;

  const records = Array.from(
    document.querySelectorAll("#learning-records article.day time[datetime]")
  )
    .map((time) => ({
      date: time.getAttribute("datetime"),
      article: time.closest("article.day"),
    }))
    .filter(({ date, article }) => /^\d{4}-\d{2}-\d{2}$/.test(date) && article);

  const studiedDates = new Map();
  records.forEach(({ date, article }) => {
    const targetId = `study-${date}`;
    article.id = article.id || targetId;
    studiedDates.set(date, article.id);
  });

  const months = Array.from(
    new Set(records.map(({ date }) => date.slice(0, 7)))
  ).sort().reverse();

  const weekdayNames = ["월", "화", "수", "목", "금", "토", "일"];

  months.forEach((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7;
    const studiedCount = records.filter(({ date }) => date.startsWith(monthKey)).length;

    const monthCard = document.createElement("article");
    monthCard.className = "calendar-month";
    monthCard.setAttribute("aria-label", `${year}년 ${month}월 학습 캘린더`);

    const header = document.createElement("div");
    header.className = "calendar-month-head";
    header.innerHTML = `<h3>${year}년 ${month}월</h3><span class="calendar-count">${studiedCount}일 학습</span>`;
    monthCard.appendChild(header);

    const weekdays = document.createElement("div");
    weekdays.className = "calendar-weekdays";
    weekdayNames.forEach((name) => {
      const label = document.createElement("span");
      label.textContent = name;
      weekdays.appendChild(label);
    });
    monthCard.appendChild(weekdays);

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    for (let i = 0; i < leadingBlanks; i += 1) {
      const blank = document.createElement("span");
      blank.className = "calendar-day empty";
      blank.setAttribute("aria-hidden", "true");
      grid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const targetId = studiedDates.get(date);
      const cell = document.createElement(targetId ? "a" : "span");
      cell.className = `calendar-day${targetId ? " studied" : ""}`;
      cell.textContent = day;

      if (targetId) {
        cell.href = `#${targetId}`;
        cell.title = `${date} 학습 기록으로 이동`;
        cell.setAttribute("aria-label", `${year}년 ${month}월 ${day}일, 학습 기록 있음`);
      } else {
        cell.setAttribute("aria-label", `${year}년 ${month}월 ${day}일`);
      }

      grid.appendChild(cell);
    }

    monthCard.appendChild(grid);
    container.appendChild(monthCard);
  });
})();
