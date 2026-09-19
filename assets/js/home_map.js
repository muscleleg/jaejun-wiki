(() => {
  const root = document.querySelector("[data-home-map]");
  if (!root) return;
  const { groupLayout, edgePath } = globalThis.JWikiHomeMapLayout;
  const one = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const map = one(".hlm-map-scroll"), evidence = one(".hlm-evidence"), unitScroll = one(".hlm-unit-scroll");
  const graph = one('[data-graph="groups"]'), unitGraph = one('[data-graph="units"]');
  const cards = [...graph.querySelectorAll("[data-node]")];
  const paths = [...graph.querySelectorAll("path")];
  const nodes = cards.map(card => ({ id: card.dataset.node, newLane: card.dataset.newLane === "true" }));
  const edges = paths.map(path => ({ from: path.dataset.from, to: path.dataset.to }));
  let selected = root.dataset.initialGroup, userMoved = false, mode = "groups", scale = 1;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior = reducedMotion ? "instant" : "smooth";
  function center(element, scroller) {
    if (!element) return;
    scroller.scrollTop = Math.max(0, element.offsetTop + element.offsetHeight / 2 - scroller.clientHeight / 2);
  }
  function hints() {
    for (const [scroll, button] of [[map, one('[data-more="map"]')], [evidence, one('[data-more="evidence"]')]]) {
      const more = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 3;
      scroll.classList.toggle("has-more", more);
      button.hidden = !more || (scroll === map && mode !== "groups");
    }
  }
  function reflow() {
    const width = map.clientWidth;
    if (!width) return;
    const anchor = cards.reduce((best, card) => Math.abs(card.offsetTop + card.offsetHeight / 2 - map.scrollTop - map.clientHeight / 2) < Math.abs(best.offsetTop + best.offsetHeight / 2 - map.scrollTop - map.clientHeight / 2) ? card : best, cards[0]);
    const offset = anchor ? anchor.offsetTop - map.scrollTop : 0;
    const layout = groupLayout(nodes, edges, width);
    graph.style.width = layout.width + "px"; graph.style.height = layout.height + "px";
    const svg = graph.querySelector("svg");
    svg.setAttribute("width", layout.width); svg.setAttribute("height", layout.height);
    for (const card of cards) {
      const cell = layout.cells.get(card.dataset.node);
      Object.assign(card.style, { left: cell.x + "px", top: cell.y + "px", width: cell.w + "px", height: cell.h + "px" });
    }
    for (const path of paths) path.setAttribute("d", edgePath(layout.cells.get(path.dataset.from), layout.cells.get(path.dataset.to)));
    if (!userMoved) center(cards.find(card => card.dataset.node === selected), map);
    else if (anchor) map.scrollTop = anchor.offsetTop - offset;
    hints();
  }
  function select(id, scroll = true) {
    selected = id;
    for (const card of cards) card.classList.toggle("is-selected", card.dataset.node === id);
    for (const group of all("[data-evidence-group]")) {
      const active = group.dataset.evidenceGroup === id;
      group.classList.toggle("is-selected", active);
      if (active && scroll) evidence.scrollTo({ top: group.offsetTop, behavior });
    }
    for (const button of all("[data-select]")) button.setAttribute("aria-pressed", String(button.dataset.select === id));
  }
  function setMode(next) {
    mode = next;
    map.hidden = next !== "groups"; unitScroll.hidden = next !== "units";
    one(".hlm-map-pane").classList.toggle("is-unit", next === "units");
    for (const selector of [".hlm-unit-tools", ".hlm-zoom", ".hlm-back"]) one(selector).hidden = next !== "units";
    if (next === "groups") reflow();
    hints();
  }
  function zoom(next) {
    const old = scale;
    scale = Math.min(1.6, Math.max(.03, next));
    unitGraph.style.zoom = scale;
    unitScroll.scrollLeft = (unitScroll.scrollLeft + unitScroll.clientWidth / 2) * scale / old - unitScroll.clientWidth / 2;
    one(".hlm-zoom output").textContent = Math.round(scale * 100) + "%";
  }
  function focusUnit(nodeId) {
    const node = [...unitGraph.querySelectorAll("[data-node]")].find(item => item.dataset.node === nodeId);
    if (node) { zoom(.85); unitScroll.scrollLeft = node.offsetLeft * scale + node.offsetWidth * scale / 2 - unitScroll.clientWidth / 2; }
  }
  root.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute("data-select")) select(button.dataset.select);
    if (button.hasAttribute("data-process")) {
      select(button.dataset.process); setMode("units");
      const target = all("[data-unit-target]").find(item => item.dataset.unitTarget === button.dataset.process);
      focusUnit(target?.dataset.targetNode);
    }
    if (button.hasAttribute("data-description")) {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open)); button.textContent = open ? "접기" : "더 보기";
      button.parentElement.classList.toggle("is-open", open); hints();
    }
    if (button.classList.contains("hlm-expand")) {
      const wide = one(".hlm-layout").classList.toggle("is-wide");
      one(".hlm-evidence-pane").hidden = wide;
      button.setAttribute("aria-expanded", String(wide)); button.setAttribute("aria-label", wide ? "학습 근거 함께 보기" : "지도 넓게 보기");
      button.textContent = wide ? "⤡" : "⤢"; reflow();
    }
    if (button.classList.contains("hlm-back")) setMode("groups");
    if (button.hasAttribute("data-more")) {
      const scroll = button.dataset.more === "map" ? map : evidence;
      if (scroll === map) userMoved = true;
      scroll.scrollBy({ top: scroll.clientHeight * .65, behavior });
    }
    if (button.hasAttribute("data-zoom")) zoom(scale * (button.dataset.zoom === "1" ? 1.2 : 1 / 1.2));
    if (button.hasAttribute("data-fit")) { zoom(unitScroll.clientWidth / unitGraph.offsetWidth); unitScroll.scrollLeft = 0; }
  });
  one('input[type="search"]').addEventListener("input", event => {
    const query = event.target.value.trim().toLocaleLowerCase();
    const matches = [...unitGraph.querySelectorAll("[data-node]")].filter(node => node.textContent.toLocaleLowerCase().includes(query));
    for (const node of unitGraph.querySelectorAll("[data-node]")) node.classList.toggle("is-selected", !!query && matches.includes(node));
    if (query && matches.length) focusUnit(matches[0].dataset.node);
  });
  for (const type of ["wheel", "touchstart", "keydown"]) map.addEventListener(type, () => { userMoved = true; }, { passive: true });
  for (const scroll of [map, evidence]) scroll.addEventListener("scroll", hints, { passive: true });
  let drag = null;
  unitScroll.addEventListener("pointerdown", event => {
    if (event.target.closest("a, button") || event.button !== 0) return;
    drag = { x: event.clientX, left: unitScroll.scrollLeft }; unitScroll.setPointerCapture(event.pointerId);
  });
  unitScroll.addEventListener("pointermove", event => { if (drag) unitScroll.scrollLeft = drag.left - event.clientX + drag.x; });
  unitScroll.addEventListener("pointerup", () => { drag = null; });
  unitScroll.addEventListener("pointercancel", () => { drag = null; });
  select(selected, false); reflow();
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(reflow).observe(map);
  window.addEventListener("resize", reflow);
  window.addEventListener("pageshow", () => requestAnimationFrame(reflow));
  document.fonts?.ready.then(reflow);
})();
