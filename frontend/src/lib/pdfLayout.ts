export type PdfPageLayout = "single" | "spread";

const LAYOUT_KEY = "shelf:pdf-page-layout";

export const PDF_FAST_SCROLL_FACTOR = 3.2;

const FAST_WINDOW_MS = 72;
/** px/ms — a trackpad flick, not a slow read-through. */
const FAST_VELOCITY = 2.2;
/** Single fat wheel tick / flick sample. */
const FAST_BURST_PX = 56;
const FAST_HOLD_MS = 140;

export type PdfFastScrollState = {
  samples: Array<{ t: number; dy: number }>;
  holdUntil: number;
  fast: boolean;
};

export const EMPTY_PDF_FAST_SCROLL: PdfFastScrollState = {
  samples: [],
  holdUntil: 0,
  fast: false,
};

export function wheelDeltaPx(
  e: { deltaY: number; deltaMode: number },
  pageHeight: number
): number {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * pageHeight;
  return e.deltaY;
}

/** Turn on boosted scrolling while the user is flicking, then drop back. */
export function updatePdfFastScroll(
  prev: PdfFastScrollState,
  now: number,
  dy: number
): PdfFastScrollState {
  const samples = [...prev.samples, { t: now, dy }].filter(
    (s) => now - s.t <= FAST_WINDOW_MS
  );
  const t0 = samples[0]?.t ?? now;
  const span = Math.max(16, now - t0);
  const dist = samples.reduce((sum, s) => sum + Math.abs(s.dy), 0);
  const burst = Math.abs(dy) >= FAST_BURST_PX;
  const fastNow = burst || dist / span >= FAST_VELOCITY;
  const holdUntil = fastNow ? now + FAST_HOLD_MS : prev.holdUntil;
  return {
    samples,
    holdUntil,
    fast: fastNow || now < holdUntil,
  };
}

export function readPdfPageLayout(): PdfPageLayout {
  if (typeof window === "undefined") return "single";
  try {
    return localStorage.getItem(LAYOUT_KEY) === "spread" ? "spread" : "single";
  } catch {
    return "single";
  }
}

export function writePdfPageLayout(layout: PdfPageLayout) {
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    /* ignore */
  }
}

/** Pair pages into rows for 1-up or 2-up (A4 sheet) layout. */
export function pdfPageRows(
  numPages: number,
  layout: PdfPageLayout
): number[][] {
  const count = Math.max(0, Math.floor(numPages));
  if (count === 0) return [];
  if (layout !== "spread") {
    return Array.from({ length: count }, (_, i) => [i + 1]);
  }
  const rows: number[][] = [];
  for (let i = 1; i <= count; i += 2) {
    rows.push(i + 1 <= count ? [i, i + 1] : [i]);
  }
  return rows;
}

export type PdfPagePx = { w: number; h: number };

/** Size for one page wrap; pages are not forced to page-1 / A4. */
export function pdfPageCssSize(
  pageNum: number,
  sizes: Record<number, PdfPagePx>,
  fallback: PdfPagePx
): PdfPagePx {
  return sizes[pageNum] ?? fallback;
}

/** Largest page in the file — used so fit-to-sheet never clips a taller/wider page. */
export function pdfFitPageSize(
  sizes: Record<number, PdfPagePx>,
  fallback: PdfPagePx
): PdfPagePx {
  const vals = Object.values(sizes);
  if (!vals.length) return fallback;
  return {
    w: Math.max(...vals.map((s) => s.w)),
    h: Math.max(...vals.map((s) => s.h)),
  };
}

/** Scale that fits one or two pages as full sheets in the scroll viewport. */
/** 0–100 scroll progress through a PDF scroll container (matches HTML reader math). */
export function pdfReadPercent(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number
): number {
  const max = scrollHeight - clientHeight;
  if (max <= 0) return 100;
  return Math.min(100, Math.round((scrollTop / max) * 100) || 0);
}

export function fitPdfSheetScale(opts: {
  layout: PdfPageLayout;
  containerW: number;
  containerH: number;
  pageW: number;
  pageH: number;
}): number {
  const { layout, containerW, containerH, pageW, pageH } = opts;
  if (pageW <= 0 || pageH <= 0 || containerW <= 0 || containerH <= 0) {
    return 1;
  }
  const padX = 40;
  const padY = 48;
  const gutter = 12;
  const cols = layout === "spread" ? 2 : 1;
  const availW = Math.max(64, (containerW - padX - (cols - 1) * gutter) / cols);
  const availH = Math.max(64, containerH - padY);
  const scale = Math.min(availW / pageW, availH / pageH);
  return Math.min(2.5, Math.max(0.35, Math.round(scale * 100) / 100));
}
