export interface TextHighlight {
  id?: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string | null;
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

function applyOneHighlight(
  root: HTMLElement,
  start: number,
  end: number,
  color: string,
  id?: string,
  hasNote?: boolean
) {
  const segments = getTextSegments(root);
  for (const seg of segments) {
    if (seg.end <= start || seg.start >= end) continue;

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
    if (id) mark.dataset.highlightId = id;
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
      h.id,
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
