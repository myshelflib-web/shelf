import { textOffsetInRoot } from "@/lib/applyHighlights";

/** Read a stable text selection inside an HTML article root. */
export type ArticleTextSelection = {
  text: string;
  rect: DOMRect;
  startOffset: number;
  endOffset: number;
};

/**
 * Build a highlight selection from a (possibly cloned) Range.
 * Offsets use the same text-node walk as applyHighlightsToHtml — not
 * Range.toString(), which inserts extra newlines between blocks.
 */
export function readArticleTextSelection(
  contentRoot: HTMLElement,
  range?: Range
): ArticleTextSelection | null {
  let live = range ?? null;
  if (!live) {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount < 1) return null;
    live = sel.getRangeAt(0);
  }
  if (!contentRoot.contains(live.commonAncestorContainer)) return null;

  const startOffset = textOffsetInRoot(
    contentRoot,
    live.startContainer,
    live.startOffset
  );
  const endOffset = textOffsetInRoot(
    contentRoot,
    live.endContainer,
    live.endOffset
  );
  if (endOffset - startOffset < 3) return null;

  // Quote from the article plain text so it matches applied offsets.
  const plain = contentRoot.textContent ?? "";
  const rawSlice = plain.slice(startOffset, endOffset);
  const text = rawSlice.trim();
  if (text.length < 3) return null;

  const lead = rawSlice.length - rawSlice.trimStart().length;
  const trail = rawSlice.length - rawSlice.trimEnd().length;
  const trimmedStart = startOffset + lead;
  const trimmedEnd = endOffset - trail;
  if (trimmedEnd <= trimmedStart) return null;

  let rect = live.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    const clientRects = Array.from(live.getClientRects()).filter(
      (r) => r.width > 0 || r.height > 0
    );
    if (clientRects.length === 0) return null;
    rect = clientRects[0]!;
  }

  return {
    text: plain.slice(trimmedStart, trimmedEnd),
    rect,
    startOffset: trimmedStart,
    endOffset: trimmedEnd,
  };
}
