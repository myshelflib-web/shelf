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
  const broken = linkStatus === "BROKEN";

  const actionBlock = broken
    ? `<p class="preloaded-official-fallback__warn">The official link appears unavailable right now. Try again later or search for an updated URL on the publisher site.</p>`
    : link
      ? `<div class="preloaded-official-fallback__actions">
          <a href="${escapeAttr(link)}" target="_blank" rel="noopener noreferrer" class="preloaded-official-fallback__cta">Open on official site</a>
        </div>`
      : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body>
<article class="preloaded-official-fallback">
  <header class="preloaded-official-fallback__header">
    <p class="preloaded-official-fallback__kicker">Official source preview</p>
    <h1>${safeTitle}</h1>
  </header>
  <p class="preloaded-official-fallback__summary">${safeSummary}</p>
  ${actionBlock}
  <section class="preloaded-official-fallback__note" aria-label="How to read and save">
    <h2>How to use this resource</h2>
    <ul>
      <li><strong>Read full content</strong> on the official site using the button above — budget PDFs, notifications, and updates live there.</li>
      <li><strong>Sign in</strong> and tap <strong>Save to library</strong> to keep this official link in your personal Shelf (<code>/my-content</code>).</li>
      <li><strong>Why not embedded?</strong> Most government portals block in-app previews for security; Shelf shows a summary and links you to the publisher.</li>
    </ul>
  </section>
</article>
</body></html>`;
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
