export function buildPreloadedSummaryHtml(
  title: string,
  url: string,
  summary: string
): string {
  const safeTitle = title.replace(/</g, "&lt;");
  const safeSummary = summary.replace(/</g, "&lt;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body><article><h1>${safeTitle}</h1><p>${safeSummary}</p><p><a href="${url}" rel="noopener noreferrer">Open official source →</a></p><p><em>Shelf summary — full document at the linked official site.</em></p></article></body></html>`;
}
