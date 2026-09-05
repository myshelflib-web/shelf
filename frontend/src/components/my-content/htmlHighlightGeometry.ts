import type { UserContentHighlight } from "@/types";
import {
  highlightRangeKey,
  rangeFromTextOffsets,
} from "@/lib/applyHighlights";

export function isHtmlTextHighlight(h: UserContentHighlight): boolean {
  if (h.kind && h.kind !== "TEXT") return false;
  return h.endOffset > h.startOffset;
}

/** Offset-only fallback. Rect / stroke highlights stay out of the article DOM. */
export function isWrappedTextHighlight(h: UserContentHighlight): boolean {
  if (h.position?.points?.length) return false;
  if (h.position?.rects?.length) return false;
  if (h.position?.tool === "highlight") return false;
  return isHtmlTextHighlight(h);
}

/** Hit a saved line box or pen stroke (normalized to the article wrap). */
export function highlightFromClientPoint(
  clientX: number,
  clientY: number,
  origin: HTMLElement,
  highlights: UserContentHighlight[]
): UserContentHighlight | null {
  const live = window.getSelection();
  if (live && !live.isCollapsed) return null;
  const box = origin.getBoundingClientRect();
  if (box.width < 1 || box.height < 1) return null;
  const x = (clientX - box.left) / box.width;
  const y = (clientY - box.top) / box.height;
  for (let i = highlights.length - 1; i >= 0; i -= 1) {
    const h = highlights[i]!;
    for (const r of h.position?.rects ?? []) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        return h;
      }
    }
  }
  return null;
}

export function textHighlightFromEvent(
  event: { target: EventTarget | null; clientX: number; clientY: number },
  root: HTMLElement,
  highlights: UserContentHighlight[]
): UserContentHighlight | null {
  const live = window.getSelection();
  if (live && !live.isCollapsed) return null;
  const mark = (event.target as Element | null)?.closest?.(
    "mark[data-highlight-range]"
  );
  if (mark instanceof HTMLElement) {
    const key = mark.dataset.highlightRange;
    return (
      highlights.find(
        (h) => highlightRangeKey(h.startOffset, h.endOffset) === key
      ) ?? null
    );
  }
  const textHs = highlights.filter(isWrappedTextHighlight);
  for (let i = textHs.length - 1; i >= 0; i -= 1) {
    const h = textHs[i]!;
    const range = rangeFromTextOffsets(root, h.startOffset, h.endOffset);
    if (!range) continue;
    for (const r of range.getClientRects()) {
      if (
        event.clientX >= r.left &&
        event.clientX <= r.right &&
        event.clientY >= r.top &&
        event.clientY <= r.bottom
      ) {
        return h;
      }
    }
  }
  return null;
}
