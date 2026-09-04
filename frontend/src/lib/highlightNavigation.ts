import { rangeFromTextOffsets } from "@/lib/applyHighlights";
import type { UserContentHighlight } from "@/types";
import { isGenericHighlightText } from "@/lib/pdfRegionText";

/** Normalized Y within a PDF page (0–1) for scroll targeting. */
export function highlightPageOffset(h: UserContentHighlight): number {
  const rect = h.position?.rects?.[0];
  if (rect) return Math.min(1, Math.max(0, rect.y));
  const points = h.position?.points;
  if (points?.length) {
    const avg = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return Math.min(1, Math.max(0, avg));
  }
  return 0;
}

export function sortHighlightsForPanel(
  items: UserContentHighlight[]
): UserContentHighlight[] {
  return [...items].sort((a, b) => {
    const pageA = a.pageNumber ?? 0;
    const pageB = b.pageNumber ?? 0;
    if (pageA !== pageB) return pageA - pageB;

    const yA = highlightPageOffset(a);
    const yB = highlightPageOffset(b);
    if (yA !== yB) return yA - yB;

    if (a.startOffset !== b.startOffset) return a.startOffset - b.startOffset;
    return a.id.localeCompare(b.id);
  });
}

export function highlightSnippetText(h: UserContentHighlight, max = 140): string {
  const raw = h.text?.trim();
  const note = h.note?.trim();

  if (raw && !isGenericHighlightText(raw)) {
    if (raw.length <= max) return raw;
    return `${raw.slice(0, max - 1).trimEnd()}…`;
  }

  if (note) {
    if (note.length <= max) return note;
    return `${note.slice(0, max - 1).trimEnd()}…`;
  }

  if (h.position?.type === "pen" && h.position.tool === "ink") {
    return h.pageNumber ? `Ink drawing · p.${h.pageNumber}` : "Ink drawing";
  }
  if (h.kind === "REGION" || h.position?.points?.length) {
    return h.pageNumber ? `Marked section · p.${h.pageNumber}` : "Marked section";
  }
  return "Highlight";
}

export function scrollHtmlHighlight(
  container: HTMLElement,
  contentRoot: HTMLElement,
  highlight: Pick<
    UserContentHighlight,
    "id" | "startOffset" | "endOffset" | "position"
  >
): boolean {
  const stored = highlight.position?.rects?.[0];
  if (stored) {
    const top = stored.y * contentRoot.offsetHeight;
    container.scrollTo({ top: Math.max(0, top - 48), behavior: "smooth" });
    return true;
  }
  const pt = highlight.position?.points?.[0];
  if (pt) {
    const top = pt.y * contentRoot.offsetHeight;
    container.scrollTo({ top: Math.max(0, top - 48), behavior: "smooth" });
    return true;
  }
  const range = rangeFromTextOffsets(
    contentRoot,
    highlight.startOffset,
    highlight.endOffset
  );
  if (!range) return false;
  const markRect = range.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const top = markRect.top - containerRect.top + container.scrollTop;
  container.scrollTo({ top: Math.max(0, top - 48), behavior: "smooth" });
  return true;
}
