export type ParsedPageView = {
  viewPdfPage?: number
  viewPageOffset?: number
  viewScrollTop?: number
  viewScale?: number
};

function finiteNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse `{ pdfPage, pageOffset, scrollTop, scale }` from PATCH /progress. */
export function parsePageView(raw: unknown): ParsedPageView | undefined {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }
  const o = raw as Record<string, unknown>;
  const out: ParsedPageView = {};

  if ("pdfPage" in o) {
    const n = finiteNumber(o.pdfPage);
    if (n != null && n >= 1 && n <= 100_000) {
      out.viewPdfPage = Math.round(n);
    }
  }
  if ("pageOffset" in o) {
    const n = finiteNumber(o.pageOffset);
    if (n != null && n >= 0 && n <= 1) {
      out.viewPageOffset = n;
    }
  }
  if ("scrollTop" in o) {
    const n = finiteNumber(o.scrollTop);
    if (n != null && n >= 0 && n <= 20_000_000) {
      out.viewScrollTop = Math.round(n);
    }
  }
  if ("scale" in o) {
    const n = finiteNumber(o.scale);
    if (n != null && n >= 0.25 && n <= 4) {
      out.viewScale = n;
    }
  }

  return out;
}

export function hasParsedPageView(view: ParsedPageView): boolean {
  return (
    view.viewPdfPage != null ||
    view.viewPageOffset != null ||
    view.viewScrollTop != null ||
    view.viewScale != null
  );
}
