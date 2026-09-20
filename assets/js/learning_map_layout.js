// Pure layout shared by the static renderer and progressive enhancement.
(() => {
function groupLayout(nodes, edges, width = 520) {
  const columns = width >= 680 ? 3 : width >= 400 ? 2 : 1;
  const padding = 18, gap = 36, height = 112, step = 168;
  const cardWidth = Math.max(120, (width - padding * 2 - gap * (columns - 1)) / columns);
  const connected = new Set(edges.flatMap(edge => [edge.from, edge.to]));
  const ordered = [...nodes.filter(node => connected.has(node.id)), ...nodes.filter(node => !connected.has(node.id))];
  const cells = new Map();
  const outgoing = new Map(nodes.map(node => [node.id, []]));
  for (const edge of edges) outgoing.get(edge.from).push(edge.to);
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  for (const children of outgoing.values()) children.sort((a, b) => order.get(a) - order.get(b));
  let canvasWidth = width;
  let row = 0, column = 0;
  for (const node of ordered) {
    if (cells.has(node.id)) continue;
    if (outgoing.get(node.id).length > 1) {
      // A fork owns parallel columns, even when the surrounding chain wraps
      // to one column. Its descendants retain their branch's horizontal lane.
      if (column) { row++; column = 0; }
      const descendants = new Set();
      const collect = id => { if (descendants.has(id)) return; descendants.add(id); outgoing.get(id).forEach(collect); };
      collect(node.id);
      const parents = new Map([...descendants].map(id => [id, []]));
      for (const edge of edges) if (descendants.has(edge.from) && descendants.has(edge.to)) parents.get(edge.to).push(edge.from);
      const pending = new Map([...parents].map(([id, list]) => [id, list.length]));
      const queue = [node.id], depths = new Map([[node.id, 0]]), tree = new Map([...descendants].map(id => [id, []]));
      for (const id of queue) for (const child of outgoing.get(id)) {
        depths.set(child, Math.max(depths.get(child) || 0, depths.get(id) + 1));
        pending.set(child, pending.get(child) - 1);
        if (!pending.get(child)) { tree.get(id).push(child); queue.push(child); }
      }
      const spans = new Map();
      const measure = id => { const span = Math.max(1, tree.get(id).reduce((sum, child) => sum + measure(child), 0)); spans.set(id, span); return span; };
      const lanes = measure(node.id);
      const branchGap = 24;
      const branchWidth = Math.max(width, padding * 2 + lanes * 120 + (lanes - 1) * branchGap);
      canvasWidth = Math.max(canvasWidth, branchWidth);
      const branchCardWidth = (branchWidth - padding * 2 - (lanes - 1) * branchGap) / lanes;
      const branchHeight = branchCardWidth < 160 ? 140 : height, branchStep = branchHeight + 56;
      const place = (id, lane) => {
        const center = padding + (lane + spans.get(id) / 2) * (branchCardWidth + branchGap) - branchGap / 2;
        cells.set(id, { x: center - branchCardWidth / 2, y: padding + row * step + depths.get(id) * branchStep, w: branchCardWidth, h: branchHeight });
        for (const child of tree.get(id)) { place(child, lane); lane += spans.get(child); }
      };
      place(node.id, 0);
      row += Math.ceil((Math.max(...depths.values()) + 1) * branchStep / step);
      continue;
    }
    if ((node.newLane || !connected.has(node.id)) && column) { row++; column = 0; }
    cells.set(node.id, { x: padding + column * (cardWidth + gap), y: padding + row * step, w: cardWidth, h: height });
    if (++column === columns || !connected.has(node.id)) { row++; column = 0; }
  }
  return { cells, width: canvasWidth, height: Math.max(1, ...[...cells.values()].map(cell => cell.y + cell.h + padding)) };
}

function edgePoints(from, to) {
  const x = from.x + from.w / 2, y = from.y + from.h;
  const tx = to.x + to.w / 2, ty = to.y - 6;
  if (from.group && (from.group !== to.group || to.y - from.y > 152)) {
    // The gutter is outside group borders. Enter first-column cards from the
    // left, below their group heading; other columns use the empty row gap.
    const gutter = 18;
    if (to.firstColumn) return [[x, y], [x, y + 18], [gutter, y + 18], [gutter, to.y + to.h / 2], [to.x - 6, to.y + to.h / 2]];
    return [[x, y], [x, y + 18], [gutter, y + 18], [gutter, to.y - 18], [tx, to.y - 18], [tx, ty]];
  }
  if (from.y === to.y && from.x < to.x) {
    return [[from.x + from.w, to.y + to.h / 2], [to.x - 6, to.y + to.h / 2]];
  }
  const mid = y + (to.y - y) / 2;
  return [[x, y], [x, mid], [tx, mid], [tx, ty]];
}
function edgePath(from, to) {
  const points = edgePoints(from, to).filter((point, i, all) => !i || point[0] !== all[i - 1][0] || point[1] !== all[i - 1][1]);
  let path = `M ${points[0].join(' ')}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = points.slice(i - 1, i + 2);
    const before = Math.hypot(b[0] - a[0], b[1] - a[1]), after = Math.hypot(c[0] - b[0], c[1] - b[1]);
    const radius = Math.min(8, before / 2, after / 2);
    const entry = b.map((value, axis) => value + (a[axis] - value) * radius / before);
    const exit = b.map((value, axis) => value + (c[axis] - value) * radius / after);
    path += ` L ${entry.join(' ')} Q ${b.join(' ')} ${exit.join(' ')}`;
  }
  const end = points.at(-1), prev = points.at(-2), dx = Math.sign(end[0] - prev[0]), dy = Math.sign(end[1] - prev[1]);
  return path + ` L ${end.join(' ')} M ${end[0] - dx * 6 - dy * 4} ${end[1] - dy * 6 + dx * 4} L ${end.join(' ')} L ${end[0] - dx * 6 + dy * 4} ${end[1] - dy * 6 - dx * 4}`;
}
// Preserve branch/merge points and group boundaries while folding only chains.
function compactUnits(nodes, edges, revealed = new Set()) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const incoming = new Map(nodes.map(node => [node.id, []]));
  const outgoing = new Map(nodes.map(node => [node.id, []]));
  for (const edge of edges) { incoming.get(edge.to).push(edge.from); outgoing.get(edge.from).push(edge.to); }
  const protectedIds = new Set(nodes.filter(node => incoming.get(node.id).length !== 1 || outgoing.get(node.id).length !== 1).map(node => node.id));
  for (const edge of edges) if (edge.keepEndpointsVisible || edge.newLane || byId.get(edge.from).group !== byId.get(edge.to).group) {
    protectedIds.add(edge.from); protectedIds.add(edge.to);
  }
  const boundaries = new Set(protectedIds);
  for (const start of boundaries) for (const next of outgoing.get(start)) {
    const chain = [start]; let current = next;
    while (!boundaries.has(current)) { chain.push(current); current = outgoing.get(current)[0]; }
    chain.push(current);
    for (const id of [...chain.slice(0, 3), ...chain.slice(-3)]) protectedIds.add(id);
  }
  for (const id of revealed) protectedIds.add(id);
  const visible = [], representative = new Map(), seen = new Set();
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    if (protectedIds.has(node.id)) { visible.push(node); representative.set(node.id, node.id); seen.add(node.id); continue; }
    let first = node.id;
    while (!protectedIds.has(incoming.get(first)[0])) first = incoming.get(first)[0];
    const members = []; let current = first;
    while (!protectedIds.has(current)) { members.push(current); seen.add(current); current = outgoing.get(current)[0]; }
    const id = members.length > 1 ? `fold-${first}` : first;
    visible.push({ ...byId.get(first), id, members: members.length > 1 ? members : undefined });
    for (const member of members) representative.set(member, id);
  }
  return { nodes: visible, representative };
}

// Each group owns a separate band; long groups wrap without mixing groups.
function unitLayout(nodes, edges, groups, width = 600) {
  const padding = 54, gap = 36, h = 96, rowStep = 152, heading = 80;
  const columns = Math.max(1, Math.min(4, Math.floor((width - padding * 2 + gap) / 210)));
  const w = (width - padding * 2 - gap * (columns - 1)) / columns;
  const owner = new Map(nodes.map(node => [node.id, node.group]));
  const connected = new Set(edges.filter(edge => owner.get(edge.from) !== owner.get(edge.to)).flatMap(edge => [owner.get(edge.from), owner.get(edge.to)]));
  const ordered = [...groups].sort((a, b) => Number(connected.has(b.id)) - Number(connected.has(a.id)));
  const cells = new Map(), bands = new Map(); let top = 24;
  for (const group of ordered) {
    const members = nodes.filter(node => node.group === group.id);
    if (!members.length) continue;
    const memberIds = new Set(members.map(node => node.id));
    const incoming = new Map(members.map(node => [node.id, []]));
    const outgoing = new Map(members.map(node => [node.id, []]));
    for (const edge of edges) if (memberIds.has(edge.from) && memberIds.has(edge.to)) { incoming.get(edge.to).push(edge); outgoing.get(edge.from).push(edge); }
    const remaining = new Map(members.map(node => [node.id, incoming.get(node.id).length]));
    const queue = members.filter(node => !remaining.get(node.id)).map(node => node.id);
    let slot = 0;
    for (const id of queue) {
      const parents = incoming.get(id);
      if (slot % columns && parents.some(edge => edge.newLane || outgoing.get(edge.from).length > 1)) slot += columns - slot % columns;
      cells.set(id, { x: padding + slot % columns * (w + gap), y: top + heading + Math.floor(slot / columns) * rowStep, w, h, group: group.id, firstColumn: slot % columns === 0 }); slot++;
      for (const edge of outgoing.get(id)) { remaining.set(edge.to, remaining.get(edge.to) - 1); if (!remaining.get(edge.to)) queue.push(edge.to); }
    }
    const height = heading + Math.ceil(slot / columns) * rowStep - (rowStep - h) + 36;
    bands.set(group.id, { x: 38, y: top, w: width - 76, h: height });
    top += height + 64;
  }
  return { cells, bands, width, height: top, columns };
}
globalThis.JWikiHomeMapLayout = Object.freeze({ groupLayout, edgePath, edgePoints, compactUnits, unitLayout });
})();
