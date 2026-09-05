import { textOffsetInRoot } from "@/lib/applyHighlights";
import { mergeLineRects } from "./pdfViewerHelpers";

export type HtmlNormRect = { x: number; y: number; w: number; h: number };

export type HtmlTextPick = {
  text: string;
  rect: DOMRect;
  startOffset: number;
  endOffset: number;
  position: { rects: HtmlNormRect[] };
};

/** PDF-style: client rects → fractions of the page/article wrap. */
export function normRectsFromClient(
  wrap: { left: number; top: number; width: number; height: number },
  clientRects: ArrayLike<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>
): HtmlNormRect[] {
  if (wrap.width < 1 || wrap.height < 1) return [];
  return mergeLineRects(
    Array.from(clientRects)
      .filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({
        x: (r.left - wrap.left) / wrap.width,
        y: (r.top - wrap.top) / wrap.height,
        w: r.width / wrap.width,
        h: r.height / wrap.height,
      }))
  );
}

/** Same as PdfViewer.handleTextMouseUp — selection string + geometry, not innerHTML. */
export function captureHtmlTextSelection(
  contentRoot: HTMLElement,
  origin: HTMLElement
): HtmlTextPick | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount < 1) return null;
  const text = sel.toString().trim();
  if (text.length < 1) return null;
  const range = sel.getRangeAt(0);

  const isInside =
    contentRoot.contains(range.startContainer) ||
    contentRoot.contains(range.endContainer) ||
    contentRoot.contains(range.commonAncestorContainer) ||
    range.commonAncestorContainer.contains(contentRoot);
  if (!isInside) return null;
  const clientRects = range.getClientRects();
  const rects = normRectsFromClient(
    origin.getBoundingClientRect(),
    clientRects.length
      ? clientRects
      : [range.getBoundingClientRect()]
  );
  if (!rects.length) return null;

  let startOffset = 0;
  let endOffset = startOffset + text.length;
  try {
    startOffset = textOffsetInRoot(
      contentRoot,
      range.startContainer,
      range.startOffset
    );
    endOffset = textOffsetInRoot(
      contentRoot,
      range.endContainer,
      range.endOffset
    );
  } catch {
    startOffset = 0;
    endOffset = text.length;
  }
  if (endOffset <= startOffset) {
    startOffset = 0;
    endOffset = text.length;
  }

  return {
    text,
    rect: range.getBoundingClientRect(),
    startOffset,
    endOffset,
    position: { rects },
  };
}

/** Mid-line strokes so a text selection paints like the PDF highlighter. */
export function strokePointsFromRects(
  rects: HtmlNormRect[]
): Array<Array<{ x: number; y: number }>> {
  return rects
    .filter((r) => r.w > 0.002 && r.h > 0)
    .map((r) => {
      const y = r.y + r.h / 2;
      return [
        { x: r.x, y },
        { x: r.x + r.w, y },
      ];
    });
}
