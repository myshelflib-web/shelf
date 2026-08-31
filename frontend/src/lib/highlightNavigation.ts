import type { UserContentHighlight } from "@/types";

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
  if (raw) {
    if (raw.length <= max) return raw;
    return `${raw.slice(0, max - 1).trimEnd()}…`;
  }
  if (h.position?.type === "pen" && h.position.tool === "ink") return "Ink stroke";
  if (h.kind === "REGION") return "Highlighted region";
  return "Highlight";
}

export function scrollHtmlHighlight(
  container: HTMLElement,
  contentRoot: HTMLElement,
  highlightId: string
): boolean {
  const mark = contentRoot.querySelector(
    `mark[data-highlight-id="${CSS.escape(highlightId)}"]`
  );
  if (!mark) return false;
  const markRect = mark.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const top =
    markRect.top - containerRect.top + container.scrollTop;
  container.scrollTo({ top: Math.max(0, top - 48), behavior: "smooth" });
  return true;
}
