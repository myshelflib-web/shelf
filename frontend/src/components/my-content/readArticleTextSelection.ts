/** Read a stable text selection inside an HTML article root. */
export type ArticleTextSelection = {
  text: string;
  rect: DOMRect;
  startOffset: number;
  endOffset: number;
};

export function readArticleTextSelection(
  contentRoot: HTMLElement
): ArticleTextSelection | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount < 1) return null;

  const range = sel.getRangeAt(0);
  if (!contentRoot.contains(range.commonAncestorContainer)) return null;

  const raw = sel.toString();
  const text = raw.trim();
  if (text.length < 3) return null;

  let rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    const clientRects = Array.from(range.getClientRects()).filter(
      (r) => r.width > 0 || r.height > 0
    );
    if (clientRects.length === 0) return null;
    rect = clientRects[0]!;
  }

  // Offsets must match applyHighlightsToHtml (plain text of the article root).
  const preRange = document.createRange();
  preRange.selectNodeContents(contentRoot);
  preRange.setEnd(range.startContainer, range.startOffset);
  const startOffset = preRange.toString().length;
  const lead = raw.length - raw.trimStart().length;
  const trimmedStart = startOffset + lead;
  const trimmedEnd = trimmedStart + text.length;

  return {
    text,
    rect,
    startOffset: trimmedStart,
    endOffset: trimmedEnd,
  };
}
