(() => {
  const root = document.querySelector("[data-home-map]");
  if (!root) return;
  const { groupLayout, edgePath, compactUnits, unitLayout } = globalThis.JWikiHomeMapLayout;
  const one = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const map = one(".hlm-map-scroll"), evidence = one(".hlm-evidence"), unitScroll = one(".hlm-unit-scroll");
  const graph = one('[data-graph="groups"]'), unitGraph = one('[data-graph="units"]');
  const cards = [...graph.querySelectorAll("[data-node]")];
  const paths = [...graph.querySelectorAll("path")];
  const nodes = cards.map(card => ({ id: card.dataset.node, newLane: card.dataset.newLane === "true" }));
  const edges = paths.map(path => ({ from: path.dataset.from, to: path.dataset.to }));
  const unitCards = [...unitGraph.querySelectorAll('[data-node]')];
  const unitNodes = unitCards.map(card => ({ id: card.dataset.node, group: card.dataset.unitGroup }));
  const unitPaths = [...unitGraph.querySelectorAll('path')];
  const unitEdges = unitPaths.map(path => ({ from: path.dataset.from, to: path.dataset.to, newLane: path.dataset.newLane === 'true', keepEndpointsVisible: path.dataset.keepEndpoints === 'true' }));
  const revealed = new Set();
  let unitPositions, folds = new Map(), tx = 0, ty = 0, lastUnitWidth = 0, fitted = false;
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
    if (mode === 'units') {
      if (unitScroll.clientWidth !== lastUnitWidth) {
        const anchor = { x: (unitScroll.clientWidth / 2 - tx) / scale, y: (unitScroll.clientHeight / 2 - ty) / scale };
        layoutUnits();
        if (fitted) fitUnits();
        else { tx = unitScroll.clientWidth / 2 - anchor.x * scale; ty = unitScroll.clientHeight / 2 - anchor.y * scale; transformUnits(); }
      }
      return;
    }
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
    for (const cluster of all('[data-cluster]')) cluster.classList.toggle('is-selected', cluster.dataset.cluster === id);
    const current = cards.find(card => card.dataset.node === id);
    one('[data-focus-current]').textContent = current?.querySelector('.hlm-node-title').textContent || '학습 과정';
    for (const description of all('[data-group-description]')) description.hidden = description.dataset.groupDescription !== id;
  }
  function setMode(next) {
    mode = next;
    map.hidden = next !== "groups"; unitScroll.hidden = next !== "units";
    one(".hlm-map-pane").classList.toggle("is-unit", next === "units");
    for (const selector of [".hlm-unit-tools", ".hlm-unit-context", ".hlm-group-labels", ".hlm-zoom", ".hlm-back"]) one(selector).hidden = next !== "units";
    one('.hlm-unit-detail').hidden = true;
    one('.hlm-search-results').hidden = true;
    if (next === 'units') layoutUnits();
    if (next === "groups") reflow();
    hints();
  }
  function transformUnits() {
    unitGraph.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    one('.hlm-zoom output').textContent = Math.round(scale * 100) + '%';
    const distant = scale < .5;
    unitGraph.classList.toggle('is-distant', distant);
    const labelWidth = Math.min(280, unitScroll.clientWidth - 32);
    let lastBottom = 58;
    for (const label of all('[data-map-label]')) {
      const band = unitPositions?.bands.get(label.dataset.mapLabel);
      const y = band ? ty + (band.y + band.h / 2) * scale - 15 : -100;
      label.hidden = !distant || !band || y < 50 || y > unitScroll.clientHeight - 64;
      if (label.hidden) continue;
      const top = Math.max(lastBottom + 4, y); lastBottom = top + 28;
      Object.assign(label.style, { left: Math.max(16, Math.min(unitScroll.clientWidth - labelWidth - 16, tx + unitPositions.width * scale / 2 - labelWidth / 2)) + 'px', top: top + 'px', width: labelWidth + 'px' });
    }
  }
  function layoutUnits() {
    lastUnitWidth = unitScroll.clientWidth;
    const compact = compactUnits(unitNodes, unitEdges, revealed);
    folds = new Map(compact.nodes.filter(node => node.members).map(node => [node.id, node.members]));
    const seen = new Set(), visibleEdges = [];
    for (const edge of unitEdges) {
      const from = compact.representative.get(edge.from), to = compact.representative.get(edge.to), key = from + ':' + to;
      if (from !== to && !seen.has(key)) { visibleEdges.push({ ...edge, from, to }); seen.add(key); }
    }
    unitPositions = unitLayout(compact.nodes, visibleEdges, nodes, Math.max(360, unitScroll.clientWidth / .85));
    Object.assign(unitGraph.style, { width: unitPositions.width + 'px', height: unitPositions.height + 'px' });
    const svg = unitGraph.querySelector('svg');
    svg.setAttribute('width', unitPositions.width); svg.setAttribute('height', unitPositions.height);
    for (const card of [...unitCards, ...unitGraph.querySelectorAll('[data-fold]')]) {
      const id = card.dataset.node || card.dataset.fold, cell = unitPositions.cells.get(id);
      card.hidden = !cell;
      if (!cell) continue;
      Object.assign(card.style, { left: cell.x + 'px', top: cell.y + 'px', width: cell.w + 'px', height: cell.h + 'px' });
      if (folds.has(id)) { const count = folds.get(id).length; card.textContent = `··· ${count}개 단원 · ${Math.min(5, count)}개 더 보기`; }
    }
    for (const cluster of unitGraph.querySelectorAll('[data-cluster]')) {
      const band = unitPositions.bands.get(cluster.dataset.cluster);
      cluster.hidden = !band;
      if (band) Object.assign(cluster.style, { left: band.x + 'px', top: band.y + 'px', width: band.w + 'px', height: band.h + 'px' });
    }
    seen.clear();
    for (let i = 0; i < unitPaths.length; i++) {
      const edge = unitEdges[i], path = unitPaths[i];
      const from = compact.representative.get(edge.from), to = compact.representative.get(edge.to), key = from + ':' + to;
      const hidden = from === to || seen.has(key);
      path.style.display = hidden ? 'none' : '';
      if (!hidden) { seen.add(key); path.setAttribute('d', edgePath(unitPositions.cells.get(from), unitPositions.cells.get(to))); }
    }
    transformUnits();
  }
  function zoom(next, x = unitScroll.clientWidth / 2, y = unitScroll.clientHeight / 2) {
    const old = scale;
    scale = Math.min(1.8, Math.max(.1, next)); fitted = false;
    tx = x - (x - tx) * scale / old; ty = y - (y - ty) * scale / old;
    transformUnits();
  }
  function fitUnits() {
    scale = Math.min(1, (unitScroll.clientWidth - 32) / unitPositions.width, (unitScroll.clientHeight - 130) / unitPositions.height);
    tx = (unitScroll.clientWidth - unitPositions.width * scale) / 2;
    ty = 64 + (unitScroll.clientHeight - 130 - unitPositions.height * scale) / 2;
    fitted = true; transformUnits();
  }
  function focusGroup(id) {
    const band = unitPositions.bands.get(id);
    if (!band) return;
    select(id); scale = .85; fitted = false;
    tx = (unitScroll.clientWidth - unitPositions.width * scale) / 2;
    const available = unitScroll.clientHeight - 130;
    ty = band.h * scale <= available ? 64 + (available - band.h * scale) / 2 - band.y * scale : 64 - band.y * scale;
    transformUnits();
  }
  function focusUnit(nodeId) {
    const node = unitNodes.find(item => item.id === nodeId);
    if (!node) return;
    revealed.add(nodeId); layoutUnits(); select(node.group);
    const cell = unitPositions.cells.get(nodeId);
    scale = .85; fitted = false;
    tx = unitScroll.clientWidth / 2 - (cell.x + cell.w / 2) * scale;
    ty = unitScroll.clientHeight / 2 - (cell.y + cell.h / 2) * scale;
    for (const card of unitCards) card.classList.toggle('is-selected', card.dataset.node === nodeId);
    transformUnits();
  }
  function showDetail(id) {
    focusUnit(id);
    one('.hlm-search-results').hidden = true;
    for (const article of all('[data-detail-for]')) article.hidden = article.dataset.detailFor !== id;
    one('.hlm-unit-detail').hidden = false;
  }
  root.addEventListener("click", event => {
    const link = event.target.closest('[data-graph="units"] a');
    if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); showDetail(link.closest('[data-node]').dataset.node); return; }
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute("data-select")) { select(button.dataset.select); if (mode === 'units') focusGroup(button.dataset.select); }
    if (button.hasAttribute("data-process")) {
      select(button.dataset.process); setMode("units");
      focusGroup(button.dataset.process);
    }
    if (button.hasAttribute("data-description")) {
      const open = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(open)); button.textContent = open ? "접기" : "더 보기";
      button.parentElement.classList.toggle("is-open", open); hints();
    }
    if (button.hasAttribute("data-evidence-documents")) {
      const row = button.closest('[data-evidence-unit]');
      const panel = row.querySelector('.hlm-evidence-documents');
      const open = button.getAttribute("aria-expanded") !== "true";
      for (const toggle of row.querySelectorAll('[data-evidence-documents]')) toggle.setAttribute("aria-expanded", String(open));
      panel.hidden = !open; hints();
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
    if (button.hasAttribute("data-fit")) fitUnits();
    if (button.hasAttribute('data-focus-group')) focusGroup(button.dataset.focusGroup);
    if (button.hasAttribute('data-focus-current')) {
      const panel = one('.hlm-group-description'); panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    }
    if (button.hasAttribute('data-unit-detail')) showDetail(button.dataset.unitDetail);
    if (button.hasAttribute('data-search-result')) showDetail(button.dataset.searchResult);
    if (button.hasAttribute('data-close-detail')) one('.hlm-unit-detail').hidden = true;
    if (button.hasAttribute('data-fold')) {
      const members = folds.get(button.dataset.fold), anchor = unitPositions.cells.get(button.dataset.fold);
      for (const id of members.slice(0, 5)) revealed.add(id);
      layoutUnits(); const next = unitPositions.cells.get(members[0]);
      tx += (anchor.x - next.x) * scale; ty += (anchor.y - next.y) * scale;
      fitted = false; transformUnits();
    }
  });
  one('input[type="search"]').addEventListener("input", event => {
    const query = event.target.value.trim().toLocaleLowerCase();
    const results = all('[data-search-result]'); let matches = 0;
    for (const item of results) { item.hidden = !query || !item.textContent.toLocaleLowerCase().includes(query); if (!item.hidden) matches++; }
    one('.hlm-search-results').hidden = !query;
    one('.hlm-search-empty').hidden = matches > 0;
  });
  for (const type of ["wheel", "touchstart", "keydown"]) map.addEventListener(type, () => { userMoved = true; }, { passive: true });
  for (const scroll of [map, evidence]) scroll.addEventListener("scroll", hints, { passive: true });
  let drag = null;
  unitScroll.addEventListener("pointerdown", event => {
    if (event.target.closest("a, button") || event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, tx, ty }; unitScroll.setPointerCapture(event.pointerId);
  });
  unitScroll.addEventListener("pointermove", event => { if (drag) { tx = drag.tx + event.clientX - drag.x; ty = drag.ty + event.clientY - drag.y; fitted = false; transformUnits(); } });
  unitScroll.addEventListener("pointerup", () => { drag = null; });
  unitScroll.addEventListener("pointercancel", () => { drag = null; });
  unitScroll.addEventListener('wheel', event => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const rect = unitScroll.getBoundingClientRect();
      zoom(scale * Math.exp(-event.deltaY * .008), event.clientX - rect.left, event.clientY - rect.top);
    } else { tx -= event.deltaX; ty -= event.deltaY; fitted = false; transformUnits(); }
  }, { passive: false });
  unitScroll.addEventListener('keydown', event => {
    if (event.target.closest('button,a,input')) return;
    const offsets = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] };
    if (offsets[event.key]) { event.preventDefault(); tx += offsets[event.key][0]; ty += offsets[event.key][1]; fitted = false; transformUnits(); }
  });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { one('.hlm-unit-detail').hidden = true; one('.hlm-search-results').hidden = true; one('.hlm-group-description').hidden = true; one('[data-focus-current]').setAttribute('aria-expanded', 'false'); } });
  select(selected, false); reflow();
  if (typeof ResizeObserver !== "undefined") { const observer = new ResizeObserver(reflow); observer.observe(map); observer.observe(unitScroll); }
  window.addEventListener("resize", reflow);
  window.addEventListener("pageshow", () => requestAnimationFrame(reflow));
  document.fonts?.ready.then(reflow);
})();
