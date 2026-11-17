// Remove avoidable orthogonal detours while retaining ports, nodes and labels.
function jwikiCompactOrthogonal(points, obstacles = [], label = null) {
  const equal = (a, b) => Math.abs(a - b) < 0.02;
  const compact = values => values.filter((p, i) => !i || !equal(p.x, values[i - 1].x) || !equal(p.y, values[i - 1].y));
  const direction = (a, b) => equal(a.x, b.x) ? (b.y >= a.y ? "down" : "up") : (b.x >= a.x ? "right" : "left");
  const turns = values => {
    let last, count = 0;
    for (let i = 1; i < values.length; i++) {
      const next = direction(values[i - 1], values[i]);
      if (last && next !== last) count++;
      last = next;
    }
    return count;
  };
  const clear = (a, b) => !obstacles.some(r => equal(a.x, b.x)
    ? a.x > r.x + 0.02 && a.x < r.x + r.width - 0.02 && Math.max(Math.min(a.y, b.y), r.y) < Math.min(Math.max(a.y, b.y), r.y + r.height) - 0.02
    : a.y > r.y + 0.02 && a.y < r.y + r.height - 0.02 && Math.max(Math.min(a.x, b.x), r.x) < Math.min(Math.max(a.x, b.x), r.x + r.width) - 0.02);
  const distance = (p, a, b) => Math.hypot(
    p.x - Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), p.x)),
    p.y - Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), p.y)),
  );
  const nearest = (values, p) => Math.min(...values.slice(1).map((b, i) => distance(p, values[i], b)));
  let result = compact(points);
  if (result.length > 80) return result;
  while (true) {
    let best = turns(result), replacement;
    for (let i = 0; i < result.length - 2; i++) {
      for (let j = result.length - 1; j >= i + 2; j--) {
        const a = result[i], b = result[j];
        const choices = equal(a.x, b.x) || equal(a.y, b.y)
          ? [[a, b]] : [[a, { x: a.x, y: b.y }, b], [a, { x: b.x, y: a.y }, b]];
        for (const choice of choices) {
          const line = compact(choice);
          if (line.length < 2 || line.slice(1).some((p, k) => !clear(line[k], p))) continue;
          if (i === 0 && direction(line[0], line[1]) !== direction(result[0], result[1])) continue;
          if (j === result.length - 1 && direction(line.at(-2), line.at(-1)) !== direction(result.at(-2), result.at(-1))) continue;
          if (label) {
            const oldDistance = nearest(result.slice(i, j + 1), label);
            if (oldDistance < 12 && nearest(line, label) > oldDistance + 0.5) continue;
          }
          const candidate = compact([...result.slice(0, i), ...line, ...result.slice(j + 1)]);
          const count = turns(candidate);
          if (count < best) { best = count; replacement = candidate; }
        }
      }
    }
    if (!replacement) return result;
    result = replacement;
  }
}

(() => {
  const figures = [...document.querySelectorAll(".markdown-mermaid")];
  if (!figures.length) return;

  function showError(figure) {
    const message = figure.querySelector(".markdown-mermaid-error");
    message.textContent = "다이어그램을 표시하지 못했습니다. 아래에서 원문을 확인할 수 있습니다.";
    message.hidden = false;
    figure.querySelector(".markdown-mermaid-source").open = true;
    figure.dataset.mermaidState = "error";
  }

  function diagramElement(svg) {
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (parsed.querySelector("parsererror")) throw new Error("Invalid Mermaid SVG");
    // Mermaid fits label backgrounds tightly to the text. Give the rounded
    // labels breathing room without changing nodes, edges, or their layout.
    for (const background of parsed.querySelectorAll(".edgeLabel .label rect")) {
      const values = ["x", "y", "width", "height"].map(name => Number.parseFloat(background.getAttribute(name)));
      if (!values.every(Number.isFinite)) continue;
      const [x, y, width, height] = values;
      background.setAttribute("x", x - 8);
      background.setAttribute("y", y - 4);
      background.setAttribute("width", width + 16);
      background.setAttribute("height", height + 8);
    }
    return document.importNode(parsed.documentElement, true);
  }

  function simplifyEdges(svg) {
    const matrix = svg.getCTM();
    if (!matrix) return;
    const inverse = matrix.inverse();
    const bounds = element => {
      const b = element.getBBox(), transform = inverse.multiply(element.getCTM());
      const a = new DOMPoint(b.x, b.y).matrixTransform(transform);
      const z = new DOMPoint(b.x + b.width, b.y + b.height).matrixTransform(transform);
      return { x: a.x, y: a.y, width: z.x - a.x, height: z.y - a.y };
    };
    const nodes = [...svg.querySelectorAll(".node")].map(bounds);
    const labels = [...svg.querySelectorAll(".edgeLabel .label")].filter(e => e.textContent.trim())
      .map(e => ({ id: e.getAttribute("data-id"), ...bounds(e) }));
    for (const path of svg.querySelectorAll("path.flowchart-link")) {
      const d = path.getAttribute("d");
      if ((d.match(/[a-zA-Z]/g) || []).some(c => !["M", "L"].includes(c))) continue;
      const points = [...d.matchAll(/[ML](-?[0-9.]+),(-?[0-9.]+)/g)].map(m => ({ x: +m[1], y: +m[2] }));
      const ownLabel = labels.find(l => l.id === path.getAttribute("data-id"));
      const label = ownLabel ? { x: ownLabel.x + ownLabel.width / 2, y: ownLabel.y + ownLabel.height / 2 } : null;
      const obstacles = [...nodes, ...labels.filter(l => l !== ownLabel)];
      const result = jwikiCompactOrthogonal(points, obstacles, label);
      path.setAttribute("d", result.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(""));
    }
  }

  function addSizeControl(figure, target) {
    const svg = target.querySelector("svg");
    const intrinsicWidth = svg.viewBox.baseVal.width || Number.parseFloat(svg.getAttribute("width"));
    const toolbar = document.createElement("div");
    toolbar.className = "markdown-mermaid-toolbar";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "markdown-mermaid-size-toggle";
    button.setAttribute("aria-controls", target.id);
    toolbar.append(button);
    target.before(toolbar);

    function update() {
      const oversized = intrinsicWidth > target.clientWidth + 1;
      if (!oversized) delete figure.dataset.diagramSize;
      const original = figure.dataset.diagramSize === "original";
      toolbar.hidden = !oversized;
      button.textContent = original ? "본문 너비에 맞추기" : "원본 크기로 보기";
      button.setAttribute("aria-pressed", String(original));
    }
    button.addEventListener("click", () => {
      if (figure.dataset.diagramSize === "original") delete figure.dataset.diagramSize;
      else figure.dataset.diagramSize = "original";
      update();
    });
    update();
    if (globalThis.ResizeObserver) new ResizeObserver(update).observe(target);
    else globalThis.addEventListener("resize", update);
  }

  async function render() {
    const mermaid = globalThis.mermaid;
    if (!mermaid?.render) {
      figures.forEach(showError);
      return;
    }
    await document.fonts?.ready;
    const style = getComputedStyle(figures[0]);
    const color = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
    const palette = {
      node: color("--mermaid-node-fill", "#f3f3f3"),
      border: color("--mermaid-node-border", "#dedede"),
      text: color("--mermaid-text", "#414141"),
      line: color("--mermaid-line", "#858585"),
      surface: color("--mermaid-surface", "#ffffff"),
      cluster: color("--mermaid-group-fill", "#f9f9f9"),
      label: color("--mermaid-label-fill", "#fcfcfc"),
    };
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      suppressErrorRendering: true,
      htmlLabels: false,
      maxTextSize: 50000,
      maxEdges: 500,
      theme: "base",
      look: "classic",
      fontFamily: getComputedStyle(document.body).fontFamily,
      themeVariables: {
        fontSize: "14px",
        primaryColor: palette.node,
        primaryTextColor: palette.text,
        primaryBorderColor: palette.border,
        secondaryColor: palette.cluster,
        secondaryTextColor: palette.text,
        secondaryBorderColor: palette.border,
        tertiaryColor: palette.surface,
        tertiaryTextColor: palette.text,
        tertiaryBorderColor: palette.border,
        lineColor: palette.line,
        textColor: palette.text,
        clusterBkg: palette.cluster,
        clusterBorder: palette.border,
        edgeLabelBackground: palette.label,
        actorBkg: palette.node,
        actorBorder: palette.border,
        actorTextColor: palette.text,
        actorLineColor: palette.line,
        signalColor: palette.line,
        signalTextColor: palette.text,
        noteBkgColor: palette.cluster,
        noteBorderColor: palette.border,
        noteTextColor: palette.text,
        labelBoxBkgColor: palette.label,
        labelBoxBorderColor: palette.border,
        labelTextColor: palette.text,
        dropShadow: "none",
      },
      themeCSS: `
        .node text, .cluster-label text {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: normal;
        }
        .node tspan[font-weight="normal"], .edgeLabels tspan[font-weight="normal"] {
          font-weight: 600;
        }
        .node rect { rx: 16px; ry: 16px; }
        .node rect, .node circle, .node ellipse, .node polygon, .node path {
          stroke-width: 1px;
          filter: none;
        }
        .edgeLabels text {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.08px;
        }
        .edgeLabel .label rect {
          opacity: 1;
          rx: 13px;
          ry: 13px;
          stroke: ${palette.border};
          stroke-width: 1px;
        }
        .edgePaths .flowchart-link {
          stroke-width: 1px;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .cluster rect { rx: 16px; ry: 16px; }
      `,
      flowchart: {
        htmlLabels: false, useMaxWidth: false, look: "classic",
        padding: 16, wrappingWidth: 220, nodeSpacing: 36, rankSpacing: 48,
        diagramPadding: 16, subGraphTitleMargin: { top: 12, bottom: 12 }, curve: "stepAfter",
      },
      sequence: { useMaxWidth: false, look: "classic", actorFontSize: 14, messageFontSize: 13, noteFontSize: 14 },
      secure: ["securityLevel", "startOnLoad", "maxTextSize", "maxEdges", "suppressErrorRendering", "htmlLabels", "flowchart", "dompurifyConfig", "themeCSS"],
    });
    for (const [index, figure] of figures.entries()) {
      try {
        const source = figure.querySelector("code.language-mermaid").textContent;
        let id = `jwiki-mermaid-${index}`;
        while (document.getElementById(id)) id += "-diagram";
        const { svg } = await mermaid.render(id, source);
        const target = figure.querySelector(".markdown-mermaid-diagram");
        target.replaceChildren(diagramElement(svg));
        target.hidden = false;
        simplifyEdges(target.querySelector("svg"));
        if (!target.id) target.id = `${id}-viewport`;
        addSizeControl(figure, target);
        figure.querySelector(".markdown-mermaid-source").open = false;
        figure.dataset.mermaidState = "rendered";
      } catch {
        showError(figure);
      }
    }
  }
  render().catch(() => figures.forEach(showError));
})();
