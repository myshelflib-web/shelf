export const PDF_SCALE_MIN = 0.35;
export const PDF_SCALE_MAX = 2.5;

/** Trackpad pinch arrives as many small pixel deltas; mouse ticks are larger. */
const WHEEL_ZOOM_SENSITIVITY = 0.005;
const WHEEL_ZOOM_MAX_STEP = 0.12;

export function clampPdfScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(PDF_SCALE_MAX, Math.max(PDF_SCALE_MIN, scale));
}

/** Ctrl/Cmd + wheel, or a trackpad pinch (browsers report pinch as ctrl+wheel). */
export function isPdfZoomWheel(e: {
  ctrlKey: boolean;
  metaKey: boolean;
}): boolean {
  return e.ctrlKey || e.metaKey;
}

export function nextPdfWheelScale(
  current: number,
  deltaY: number,
  deltaMode: number
): number {
  const px =
    deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 800 : deltaY;
  let factor = Math.exp(-px * WHEEL_ZOOM_SENSITIVITY);
  factor = Math.min(
    1 + WHEEL_ZOOM_MAX_STEP,
    Math.max(1 - WHEEL_ZOOM_MAX_STEP, factor)
  );
  return clampPdfScale(current * factor);
}

export type PdfZoomAnchor = {
  contentX: number;
  contentY: number;
  cursorX: number;
  cursorY: number;
  ratio: number;
};

export function capturePdfZoomAnchor(
  root: Pick<HTMLElement, "getBoundingClientRect" | "scrollLeft" | "scrollTop">,
  clientX: number,
  clientY: number,
  ratio: number
): PdfZoomAnchor {
  const rect = root.getBoundingClientRect();
  const cursorX = clientX - rect.left;
  const cursorY = clientY - rect.top;
  return {
    contentX: root.scrollLeft + cursorX,
    contentY: root.scrollTop + cursorY,
    cursorX,
    cursorY,
    ratio,
  };
}

export function applyPdfZoomAnchor(
  root: { scrollLeft: number; scrollTop: number },
  anchor: PdfZoomAnchor
) {
  root.scrollLeft = anchor.contentX * anchor.ratio - anchor.cursorX;
  root.scrollTop = anchor.contentY * anchor.ratio - anchor.cursorY;
}

/** Wait until a pinch burst settles before re-rendering PDF.js canvases. */
export const PDF_ZOOM_COMMIT_MS = 100;

export function pdfZoomContentEl(root: HTMLElement): HTMLElement | null {
  const marked = root.querySelector("[data-pdf-zoom-content]");
  if (marked instanceof HTMLElement) return marked;
  return root.firstElementChild instanceof HTMLElement
    ? root.firstElementChild
    : null;
}

/** Untransformed content-local point under the cursor (capture before CSS scale). */
export function pdfVisualZoomOrigin(
  content: Pick<HTMLElement, "getBoundingClientRect">,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = content.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}

export function applyPdfVisualZoom(
  content: HTMLElement,
  originX: number,
  originY: number,
  ratio: number
) {
  const safe = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  content.style.transformOrigin = `${originX}px ${originY}px`;
  content.style.transform = Math.abs(safe - 1) < 0.0001 ? "none" : `scale(${safe})`;
}

export function clearPdfVisualZoom(content: HTMLElement) {
  content.style.transform = "";
  content.style.transformOrigin = "";
}
