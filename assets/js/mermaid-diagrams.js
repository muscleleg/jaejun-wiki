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
        diagramPadding: 16, subGraphTitleMargin: { top: 12, bottom: 12 }, curve: "rounded",
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
