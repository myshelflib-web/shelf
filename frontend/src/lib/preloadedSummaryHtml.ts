/** Shelf-hosted summary when an official site cannot embed inline. */
export function buildPreloadedSummaryHtml(
  title: string,
  url: string | null | undefined,
  summary: string,
  opts?: { linkStatus?: string | null }
): string {
  const safeTitle = escapeHtml(title);
  const safeSummary = escapeHtml(summary || "Official resource on Shelf Learn.");
  const link = url?.trim();
  const linkStatus = opts?.linkStatus;
  const linkBlock =
    linkStatus === "BROKEN"
      ? `<p class="text-[var(--text-secondary)]">The official link appears unavailable right now. Try again later or search for an updated URL on the publisher site.</p>`
      : link
        ? `<p><a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] hover:underline font-medium">Open official source in browser →</a></p>`
        : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body><article><h1>${safeTitle}</h1><p>${safeSummary}</p>${linkBlock}<p><em>Shelf summary — most government portals block in-app embeds; use the official link for the full site.</em></p></article></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
