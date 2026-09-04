export interface TextHighlight {
  id?: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string | null;
}

/** Stable DOM key for a highlight span — ignores tmp→server id swaps. */
export function highlightRangeKey(start: number, end: number): string {
  return `${start}:${end}`;
}

function getTextSegments(root: HTMLElement) {
  const segments: { node: Text; start: number; end: number }[] = [];
  let pos = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const text = n as Text;
    const len = text.data.length;
    if (len === 0) continue;
    segments.push({ node: text, start: pos, end: pos + len });
    pos += len;
  }
  return segments;
}

/**
 * Character offset of (container, offset) within root — same metric as
 * applyHighlights (concatenated text-node data), not Range.toString().
 */
export function textOffsetInRoot(
  root: HTMLElement,
  container: Node,
  offset: number
): number {
  if (!root.contains(container) && container !== root) return 0;

  if (container.nodeType === Node.TEXT_NODE) {
    let pos = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const text = n as Text;
      if (text === container) {
        return pos + Math.max(0, Math.min(offset, text.data.length));
      }
      pos += text.data.length;
    }
    return pos;
  }

  // Element boundary: offset is a child index. Count text fully before that child.
  let pos = 0;
  const parent = container as Element;
  const limit = Math.max(0, Math.min(offset, parent.childNodes.length));
  for (let i = 0; i < limit; i += 1) {
    const child = parent.childNodes[i];
    if (!child) continue;
    if (child.nodeType === Node.TEXT_NODE) {
      pos += (child as Text).data.length;
      continue;
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) {
        pos += (n as Text).data.length;
      }
    }
  }
  return pos;
}

function isInsideMark(node: Node): boolean {
  const el =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;
  return Boolean(el?.closest("mark[data-highlight-range]"));
}

function applyOneHighlight(
  root: HTMLElement,
  start: number,
  end: number,
  color: string,
  rangeKey: string,
  hasNote?: boolean
) {
  // Re-walk each time so earlier marks in this pass are visible and we never
  // nest <mark> inside <mark> (nested marks break selection in Chromium).
  const segments = getTextSegments(root);
  for (const seg of segments) {
    if (seg.end <= start || seg.start >= end) continue;
    if (isInsideMark(seg.node)) continue;

    const node = seg.node;
    const parent = node.parentNode;
    if (!parent) continue;

    const localStart = Math.max(0, start - seg.start);
    const localEnd = Math.min(node.data.length, end - seg.start);
    if (localStart >= localEnd) continue;

    const before = node.data.slice(0, localStart);
    const mid = node.data.slice(localStart, localEnd);
    const after = node.data.slice(localEnd);

    const mark = document.createElement("mark");
    mark.className = `highlight-${color}${hasNote ? " has-note" : ""}`;
    mark.dataset.highlightRange = rangeKey;
    mark.title = hasNote
      ? "Open highlight · Alt-click to remove"
      : "Open highlight · Alt-click to remove";
    mark.textContent = mid;

    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(mark);
    if (after) frag.appendChild(document.createTextNode(after));

    parent.insertBefore(frag, node);
    parent.removeChild(node);
  }
}

/** Visual signature — same paint ⇒ same HTML (tmp id swaps must not remount). */
export function highlightPaintKey(
  highlights: ReadonlyArray<TextHighlight>
): string {
  return highlights
    .filter((h) => h.endOffset > h.startOffset)
    .map(
      (h) =>
        `${h.startOffset}:${h.endOffset}:${h.color}:${h.note?.trim() ? "1" : "0"}`
    )
    .sort()
    .join("|");
}

/** Apply highlight marks inside HTML without stripping document structure. */
export function applyHighlightsToHtml(
  html: string,
  highlights: TextHighlight[]
): string {
  if (!highlights.length || !html) return html;
  if (typeof document === "undefined") return html;

  const root = document.createElement("div");
  root.innerHTML = html;

  const sorted = [...highlights]
    .filter((h) => h.endOffset > h.startOffset)
    .sort((a, b) => b.startOffset - a.startOffset);

  for (const h of sorted) {
    applyOneHighlight(
      root,
      h.startOffset,
      h.endOffset,
      h.color,
      highlightRangeKey(h.startOffset, h.endOffset),
      Boolean(h.note?.trim())
    );
  }

  return root.innerHTML;
}

/** Plain-text length of HTML — matches browser textContent offsets. */
export function htmlPlainTextLength(html: string): number {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, "").length;
  }
  const root = document.createElement("div");
  root.innerHTML = html;
  return root.textContent?.length ?? 0;
}
