import { SKETCH_PAGE_H, SKETCH_PAGE_W } from "./sketchNotebook";

/** Map a pointer to unscaled A4 sheet coords, including while the page is zoomed. */
export function clientToSketchPoint(
  el: { getBoundingClientRect: () => Pick<DOMRect, "left" | "top" | "width" | "height"> } | null,
  clientX: number,
  clientY: number,
  pageW = SKETCH_PAGE_W,
  pageH = SKETCH_PAGE_H
): { x: number; y: number } {
  if (!el) return { x: 0, y: 0 };
  const r = el.getBoundingClientRect();
  if (!(r.width > 0) || !(r.height > 0)) return { x: 0, y: 0 };
  return {
    x: ((clientX - r.left) / r.width) * pageW,
    y: ((clientY - r.top) / r.height) * pageH,
  };
}
