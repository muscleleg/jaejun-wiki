// Pure layout shared by the static renderer and progressive enhancement.
(() => {
function groupLayout(nodes, edges, width = 520) {
  const columns = width >= 680 ? 3 : width >= 400 ? 2 : 1;
  const padding = 18, gap = 36, height = 112, step = 168;
  const cardWidth = Math.max(120, (width - padding * 2 - gap * (columns - 1)) / columns);
  const connected = new Set(edges.flatMap(edge => [edge.from, edge.to]));
  const ordered = [...nodes.filter(node => connected.has(node.id)), ...nodes.filter(node => !connected.has(node.id))];
  const cells = new Map();
  let row = 0, column = 0;
  for (const node of ordered) {
    if ((node.newLane || !connected.has(node.id)) && column) { row++; column = 0; }
    cells.set(node.id, { x: padding + column * (cardWidth + gap), y: padding + row * step, w: cardWidth, h: height });
    if (++column === columns || !connected.has(node.id)) { row++; column = 0; }
  }
  return { cells, width, height: Math.max(1, ...[...cells.values()].map(cell => cell.y + cell.h + padding)) };
}

function edgePath(from, to) {
  if (from.group && from.group !== to.group) {
    const x = from.x + from.w / 2, y = from.y + from.h;
    const tx = to.x + to.w / 2, ty = to.y - 6;
    return `M ${x} ${y} V ${y + 24} H 16 V ${ty - 8} H ${tx} V ${ty} M ${tx - 4} ${ty - 6} L ${tx} ${ty} L ${tx + 4} ${ty - 6}`;
  }
  if (from.y === to.y && from.x < to.x) {
    const x = to.x - 6, y = to.y + to.h / 2;
    return `M ${from.x + from.w} ${y} H ${x} M ${x - 6} ${y - 4} L ${x} ${y} L ${x - 6} ${y + 4}`;
  }
  const x = from.x + from.w / 2, y = from.y + from.h;
  const tx = to.x + to.w / 2, ty = to.y - 6, mid = y + 24;
  return `M ${x} ${y} V ${mid} H ${tx} V ${ty} M ${tx - 4} ${ty - 6} L ${tx} ${ty} L ${tx + 4} ${ty - 6}`;
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
  const padding = 24, gap = 36, h = 96, rowStep = 140;
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
      cells.set(id, { x: padding + slot % columns * (w + gap), y: top + 58 + Math.floor(slot / columns) * rowStep, w, h, group: group.id }); slot++;
      for (const edge of outgoing.get(id)) { remaining.set(edge.to, remaining.get(edge.to) - 1); if (!remaining.get(edge.to)) queue.push(edge.to); }
    }
    const height = 58 + Math.ceil(slot / columns) * rowStep - (rowStep - h) + 20;
    bands.set(group.id, { x: 10, y: top, w: width - 20, h: height });
    top += height + 64;
  }
  return { cells, bands, width, height: top, columns };
}
globalThis.JWikiHomeMapLayout = Object.freeze({ groupLayout, edgePath, compactUnits, unitLayout });
})();
