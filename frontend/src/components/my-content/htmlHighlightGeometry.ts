import type { UserContentHighlight } from "@/types";
import { rangeFromTextOffsets } from "@/lib/applyHighlights";

export type OverlayBox = {
  id: string;
  color: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

export function isHtmlTextHighlight(h: UserContentHighlight): boolean {
  if (h.kind && h.kind !== "TEXT") return false;
  return h.endOffset > h.startOffset;
}

export function overlayBoxesForHighlights(
  contentRoot: HTMLElement,
  origin: DOMRect,
  highlights: UserContentHighlight[]
): OverlayBox[] {
  const boxes: OverlayBox[] = [];
  for (const h of highlights) {
    if (!isHtmlTextHighlight(h)) continue;
    const range = rangeFromTextOffsets(contentRoot, h.startOffset, h.endOffset);
    if (!range) continue;
    const rects = Array.from(range.getClientRects()).filter(
      (r) => r.width > 0 && r.height > 0
    );
    for (const r of rects) {
      boxes.push({
        id: h.id,
        color: h.color || "yellow",
        left: r.left - origin.left,
        top: r.top - origin.top,
        width: r.width,
        height: r.height,
      });
    }
  }
  return boxes;
}

export function highlightIdAtPoint(
  boxes: OverlayBox[],
  x: number,
  y: number
): string | null {
  for (let i = boxes.length - 1; i >= 0; i -= 1) {
    const b = boxes[i]!;
    if (
      x >= b.left &&
      x <= b.left + b.width &&
      y >= b.top &&
      y <= b.top + b.height
    ) {
      return b.id;
    }
  }
  return null;
}
