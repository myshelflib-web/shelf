import {
  canvasBgIsDark,
  canvasBgTone,
  canvasFgColor,
  normalizeCanvasBg,
  type BlankStroke,
  pointsToPath,
} from "./blankCanvas";

/** A4-ish page at 96dpi — GoodNotes-style fixed sheets. */
export const SKETCH_PAGE_W = 794;
export const SKETCH_PAGE_H = 1123;

export type SketchTemplate = "blank" | "ruled" | "grid";

export const SKETCH_TEMPLATES: {
  id: SketchTemplate;
  label: string;
  hint: string;
}[] = [
  { id: "blank", label: "Blank", hint: "Plain — no lines" },
  { id: "ruled", label: "Ruled", hint: "Lined notebook paper" },
  { id: "grid", label: "Grid", hint: "Math / graph paper" },
];

/** GoodNotes-inspired paper colors. */
export const SKETCH_BACKGROUNDS = [
  { id: "white", color: "#ffffff", label: "White" },
  { id: "paper", color: "#f4f1ea", label: "Paper" },
  { id: "cream", color: "#fef9e7", label: "Cream" },
  { id: "sky", color: "#e8f4fc", label: "Sky" },
  { id: "mint", color: "#ecfdf5", label: "Mint" },
  { id: "lavender", color: "#f3f0ff", label: "Lavender" },
  { id: "charcoal", color: "#2d2d2d", label: "Charcoal" },
  { id: "black", color: "#0c0c0d", label: "Black" },
] as const;

export type SketchPage = {
  index: number;
  bg: string;
  template: SketchTemplate;
  paths: BlankStroke[];
};

export type SketchNotebook = {
  activeIndex: number;
  pages: SketchPage[];
};

export function defaultSketchPage(
  index: number,
  opts?: { bg?: string; template?: SketchTemplate }
): SketchPage {
  return {
    index,
    bg: normalizeCanvasBg(opts?.bg ?? "#ffffff"),
    template: opts?.template ?? "ruled",
    paths: [],
  };
}

export function serializeSketchPage(page: SketchPage): string {
  const bg = normalizeCanvasBg(page.bg);
  const tone = canvasBgTone(bg);
  const fg = canvasFgColor(bg);
  const pathHtml = page.paths
    .map(
      (p) =>
        `<path class="blank-draw-stroke" d="${p.d.replace(/"/g, "")}" fill="none" stroke="${p.color.replace(/"/g, "")}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round"></path>`
    )
    .join("");
  return `<div class="shelf-sketch-page" data-index="${page.index}" data-bg="${bg}" data-template="${page.template}" data-bg-tone="${tone}" data-w="${SKETCH_PAGE_W}" data-h="${SKETCH_PAGE_H}" style="width:${SKETCH_PAGE_W}px;height:${SKETCH_PAGE_H}px;background-color:${bg};color:${fg};"><svg class="blank-draw-layer" width="${SKETCH_PAGE_W}" height="${SKETCH_PAGE_H}" viewBox="0 0 ${SKETCH_PAGE_W} ${SKETCH_PAGE_H}">${pathHtml}</svg></div>`;
}

export function serializeSketchNotebook(notebook: SketchNotebook): string {
  const active = Math.max(
    0,
    Math.min(notebook.activeIndex, notebook.pages.length - 1)
  );
  const pagesHtml = notebook.pages.map(serializeSketchPage).join("");
  return `<div class="shelf-sketch-notebook" data-active="${active}">${pagesHtml}</div>`;
}

export function createSketchNotebookHtml(opts?: {
  bg?: string;
  template?: SketchTemplate;
}): string {
  return serializeSketchNotebook({
    activeIndex: 0,
    pages: [defaultSketchPage(0, opts)],
  });
}

export function isSketchNotebookHtml(html: string): boolean {
  return /shelf-sketch-notebook/.test(html);
}

function parsePaths(section: Element): BlankStroke[] {
  return [...section.querySelectorAll("svg.blank-draw-layer path")]
    .map((p) => ({
      d: p.getAttribute("d") || "",
      color: p.getAttribute("stroke") || "#1f2937",
      width: Number(p.getAttribute("stroke-width")) || 2.5,
    }))
    .filter((p) => p.d);
}

export function parseSketchNotebook(html: string): SketchNotebook {
  if (typeof document === "undefined") {
    return {
      activeIndex: 0,
      pages: [defaultSketchPage(0)],
    };
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const root = wrap.querySelector(".shelf-sketch-notebook");
  if (!root) {
    return {
      activeIndex: 0,
      pages: [defaultSketchPage(0)],
    };
  }
  const activeIndex = Number(root.getAttribute("data-active")) || 0;
  const sections = [...root.querySelectorAll(".shelf-sketch-page")];
  const pages: SketchPage[] =
    sections.length > 0
      ? sections.map((el, i) => ({
          index: Number(el.getAttribute("data-index")) || i,
          bg: normalizeCanvasBg(el.getAttribute("data-bg")),
          template: (el.getAttribute("data-template") as SketchTemplate) || "ruled",
          paths: parsePaths(el),
        }))
      : [defaultSketchPage(0)];
  return {
    activeIndex: Math.max(0, Math.min(activeIndex, pages.length - 1)),
    pages,
  };
}

export function sketchTemplateClass(template: SketchTemplate): string {
  return `sketch-template-${template}`;
}

export { pointsToPath, canvasBgIsDark };
