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
  if (from.y === to.y && from.x < to.x) {
    const x = to.x - 6, y = to.y + to.h / 2;
    return `M ${from.x + from.w} ${y} H ${x} M ${x - 6} ${y - 4} L ${x} ${y} L ${x - 6} ${y + 4}`;
  }
  const x = from.x + from.w / 2, y = from.y + from.h;
  const tx = to.x + to.w / 2, ty = to.y - 6, mid = y + 24;
  return `M ${x} ${y} V ${mid} H ${tx} V ${ty} M ${tx - 4} ${ty - 6} L ${tx} ${ty} L ${tx + 4} ${ty - 6}`;
}
globalThis.JWikiHomeMapLayout = Object.freeze({ groupLayout, edgePath });
})();
