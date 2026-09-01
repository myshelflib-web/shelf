import type { DiagramSpec } from "./types.js";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stepList(diagram: DiagramSpec, className: string): string {
  const steps = diagram.steps ?? [];
  return `<ol class="${className}">${steps
    .map(
      (s, i) =>
        `<li class="shelf-diagram__step"><span class="shelf-diagram__index">${
          i + 1
        }</span><span class="shelf-diagram__body"><span class="shelf-diagram__label">${esc(
          s.label
        )}</span>${
          s.detail
            ? `<span class="shelf-diagram__detail">${esc(s.detail)}</span>`
            : ""
        }</span></li>`
    )
    .join("")}</ol>`;
}

function compareGrid(diagram: DiagramSpec): string {
  const rows = diagram.rows ?? [];
  const head = `<div class="shelf-diagram__row shelf-diagram__row--head"><div class="shelf-diagram__cell">${esc(
    diagram.leftHeading || "Option A"
  )}</div><div class="shelf-diagram__cell">${esc(
    diagram.rightHeading || "Option B"
  )}</div></div>`;
  return `<div class="shelf-diagram__grid">${head}${rows
    .map(
      (r) =>
        `<div class="shelf-diagram__row"><div class="shelf-diagram__cell">${esc(
          r.left
        )}</div><div class="shelf-diagram__cell">${esc(r.right)}</div></div>`
    )
    .join("")}</div>`;
}

function cardGrid(diagram: DiagramSpec): string {
  const steps = diagram.steps ?? [];
  return `<div class="shelf-diagram__cards">${steps
    .map(
      (s) =>
        `<div class="shelf-diagram__card"><p class="shelf-diagram__label">${esc(
          s.label
        )}</p>${
          s.detail
            ? `<p class="shelf-diagram__detail">${esc(s.detail)}</p>`
            : ""
        }</div>`
    )
    .join("")}</div>`;
}

function cycleRing(diagram: DiagramSpec): string {
  const steps = diagram.steps ?? [];
  return `<ol class="shelf-diagram__cycle">${steps
    .map(
      (s, i) =>
        `<li class="shelf-diagram__cycle-step"><span class="shelf-diagram__index">${
          i + 1
        }</span><span class="shelf-diagram__label">${esc(s.label)}</span>${
          s.detail
            ? `<span class="shelf-diagram__detail">${esc(s.detail)}</span>`
            : ""
        }</li>`
    )
    .join("")}</ol>`;
}

/**
 * Diagrams are class-annotated HTML rather than inline SVG or raster images,
 * because the reader sanitizer strips <svg> and style attributes. https images
 * would survive, but illustration models are a separate cost — these figures
 * render in the reader for every page at zero extra token spend.
 */
export function renderDiagramHtml(diagram: DiagramSpec | null): string {
  if (!diagram) return "";

  let body = "";
  if (diagram.kind === "compare") body = compareGrid(diagram);
  else if (diagram.kind === "cards") body = cardGrid(diagram);
  else if (diagram.kind === "cycle") body = cycleRing(diagram);
  else body = stepList(diagram, "shelf-diagram__steps");

  const caption = diagram.caption
    ? `<p class="shelf-diagram__caption">${esc(diagram.caption)}</p>`
    : "";

  return `<figure class="shelf-diagram shelf-diagram--${diagram.kind}"><figcaption class="shelf-diagram__title">${esc(
    diagram.title
  )}</figcaption>${body}${caption}</figure>`;
}

export function renderGlanceHtml(
  glance: { title: string; cards: { label: string; detail: string }[] } | null
): string {
  if (!glance || glance.cards.length === 0) return "";
  const cards = glance.cards
    .map(
      (c) =>
        `<div class="shelf-glance__card"><p class="shelf-glance__label">${esc(
          c.label
        )}</p><p class="shelf-glance__detail">${esc(c.detail)}</p></div>`
    )
    .join("");
  return `<aside class="shelf-glance"><h2>${esc(
    glance.title
  )}</h2><div class="shelf-glance__grid">${cards}</div></aside>`;
}

/** Text-mode rendering of the same diagram, used in the .txt artifact. */
export function renderDiagramText(diagram: DiagramSpec | null): string {
  if (!diagram) return "";
  const lines = [`[${diagram.kind.toUpperCase()} DIAGRAM] ${diagram.title}`];

  if (diagram.kind === "compare") {
    lines.push(`${diagram.leftHeading || "A"}  |  ${diagram.rightHeading || "B"}`);
    for (const row of diagram.rows ?? []) {
      lines.push(`- ${row.left}  |  ${row.right}`);
    }
  } else {
    (diagram.steps ?? []).forEach((step, i) => {
      lines.push(`${i + 1}. ${step.label}${step.detail ? ` — ${step.detail}` : ""}`);
    });
  }

  if (diagram.caption) lines.push(diagram.caption);
  return lines.join("\n");
}
