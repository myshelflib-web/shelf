/** Prepare Study AI export DOM for html2canvas (mermaid SVG + KaTeX layout). */

export async function renderMermaidExports(root: HTMLElement): Promise<void> {
  const blocks = [...root.querySelectorAll<HTMLElement>("[data-mermaid-source]")];
  if (!blocks.length) return;

  const mermaid = (await import("mermaid")).default;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "default",
    fontFamily: "Calibri, Arial, sans-serif",
  });

  let index = 0;
  for (const block of blocks) {
    const source = block.getAttribute("data-mermaid-source") ?? "";
    block.removeAttribute("data-mermaid-source");
    try {
      const { svg } = await mermaid.render(`shelf-export-mmd-${index++}`, source);
      block.innerHTML = svg;
      block.classList.add("mermaid-rendered");
    } catch {
      block.innerHTML = `<pre class="code-block"><code>${source.replace(/</g, "&lt;")}</code></pre>`;
    }
  }
}

/** html2canvas mis-renders KaTeX absolute positioning — flatten before capture. */
export function stabilizeKatexForCapture(root: HTMLElement): void {
  root.querySelectorAll(".katex").forEach((node) => {
    const el = node as HTMLElement;
    el.style.setProperty("display", "inline-block", "important");
    el.style.setProperty("vertical-align", "middle", "important");
    el.style.setProperty("line-height", "1.2", "important");
    el.style.setProperty("overflow", "visible", "important");
    el.querySelectorAll(".katex-html, .base, .strut").forEach((child) => {
      (child as HTMLElement).style.setProperty("position", "static", "important");
    });
  });

  root.querySelectorAll(".katex-display, .math-block").forEach((node) => {
    const el = node as HTMLElement;
    el.style.setProperty("display", "block", "important");
    el.style.setProperty("text-align", "center", "important");
    el.style.setProperty("margin", "0.75em 0", "important");
    el.style.setProperty("overflow", "visible", "important");
  });
}

export async function prepareExportBody(body: HTMLElement): Promise<void> {
  await renderMermaidExports(body);
  stabilizeKatexForCapture(body);
  await new Promise((r) => window.setTimeout(r, 150));
}
