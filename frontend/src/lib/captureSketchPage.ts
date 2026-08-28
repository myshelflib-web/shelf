import type { BlankStroke } from "./blankCanvas";
import { canvasToJpegDataUrl } from "./pdfPageImage";
import { SKETCH_PAGE_H, SKETCH_PAGE_W } from "./sketchNotebook";

export type SketchCaptureStroke = Pick<BlankStroke, "d" | "color" | "width">;

/** Rasterize sketch ink to a JPEG for Study AI vision (sync, like PDF page capture). */
export function captureSketchFromStrokes(
  bg: string,
  paths: SketchCaptureStroke[],
  width = SKETCH_PAGE_W,
  height = SKETCH_PAGE_H
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = bg || "#ffffff";
  ctx.fillRect(0, 0, width, height);

  for (const stroke of paths) {
    const d = stroke.d?.trim();
    if (!d) continue;
    try {
      const path = new Path2D(d);
      ctx.strokeStyle = stroke.color || "#000000";
      ctx.lineWidth = stroke.width || 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(path);
    } catch {
      /* skip malformed paths */
    }
  }

  return canvasToJpegDataUrl(canvas);
}

function strokesFromElement(el: HTMLElement): SketchCaptureStroke[] {
  const paths: SketchCaptureStroke[] = [];
  el.querySelectorAll("path.blank-draw-stroke").forEach((node) => {
    if (!(node instanceof SVGPathElement)) return;
    if (node.classList.contains("opacity-80")) return;
    const d = node.getAttribute("d");
    if (!d) return;
    paths.push({
      d,
      color: node.getAttribute("stroke") || "#000000",
      width: Number(node.getAttribute("stroke-width")) || 2,
    });
  });
  return paths;
}

function readSketchBg(el: HTMLElement): string {
  return (
    el.style.backgroundColor ||
    el.getAttribute("data-bg") ||
    getComputedStyle(el).backgroundColor ||
    "#ffffff"
  );
}

function readSketchDimensions(el: HTMLElement): { w: number; h: number } {
  const w = Number(el.getAttribute("data-w")) || SKETCH_PAGE_W;
  const h = Number(el.getAttribute("data-h")) || SKETCH_PAGE_H;
  return { w, h };
}

export function captureSketchFromElement(el: HTMLElement): string {
  const { w, h } = readSketchDimensions(el);
  return captureSketchFromStrokes(
    readSketchBg(el),
    strokesFromElement(el),
    w,
    h
  );
}

/** Pick the sketch sheet with the largest visible area (multi-page read view). */
export function findVisibleSketchPage(root: HTMLElement): HTMLElement | null {
  const pages = [...root.querySelectorAll<HTMLElement>(".shelf-sketch-page")];
  if (pages.length === 0) return null;
  if (pages.length === 1) return pages[0];

  let best: HTMLElement | null = null;
  let bestArea = 0;
  for (const page of pages) {
    const r = page.getBoundingClientRect();
    const visTop = Math.max(0, r.top);
    const visBottom = Math.min(window.innerHeight, r.bottom);
    const visLeft = Math.max(0, r.left);
    const visRight = Math.min(window.innerWidth, r.right);
    const area =
      Math.max(0, visBottom - visTop) * Math.max(0, visRight - visLeft);
    if (area > bestArea) {
      bestArea = area;
      best = page;
    }
  }
  return best ?? pages[0];
}

export function captureVisibleSketchPage(root: HTMLElement): string {
  const page = findVisibleSketchPage(root);
  if (!page) return "";
  return captureSketchFromElement(page);
}
