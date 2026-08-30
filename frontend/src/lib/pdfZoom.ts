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

export type PdfZoomPageBox = {
  page: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Same spot on the same sheet — gaps/padding do not scale with page CSS size. */
export type PdfZoomAnchor = {
  page: number;
  fracX: number;
  fracY: number;
  cursorX: number;
  cursorY: number;
};

export function pickPdfZoomPage(
  pages: PdfZoomPageBox[],
  clientX: number,
  clientY: number
): PdfZoomPageBox | null {
  let best: PdfZoomPageBox | null = null;
  let bestDist = Infinity;
  for (const page of pages) {
    if (page.width <= 0 || page.height <= 0) continue;
    const right = page.left + page.width;
    const bottom = page.top + page.height;
    const insideX = clientX >= page.left && clientX <= right;
    const insideY = clientY >= page.top && clientY <= bottom;
    if (insideX && insideY) return page;
    const dx = insideX ? 0 : clientX < page.left ? page.left - clientX : clientX - right;
    const dy = insideY ? 0 : clientY < page.top ? page.top - clientY : clientY - bottom;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = page;
    }
  }
  return best;
}

export function capturePdfZoomAnchorFromBoxes(
  rootLeft: number,
  rootTop: number,
  pages: PdfZoomPageBox[],
  clientX: number,
  clientY: number
): PdfZoomAnchor | null {
  const page = pickPdfZoomPage(pages, clientX, clientY);
  if (!page) return null;
  return {
    page: page.page,
    fracX: (clientX - page.left) / page.width,
    fracY: (clientY - page.top) / page.height,
    cursorX: clientX - rootLeft,
    cursorY: clientY - rootTop,
  };
}

export function nextPdfZoomScroll(
  page: PdfZoomPageBox,
  root: { left: number; top: number; scrollLeft: number; scrollTop: number },
  anchor: PdfZoomAnchor
): { scrollLeft: number; scrollTop: number } {
  const pointX = page.left + anchor.fracX * page.width;
  const pointY = page.top + anchor.fracY * page.height;
  const wantX = root.left + anchor.cursorX;
  const wantY = root.top + anchor.cursorY;
  return {
    scrollLeft: root.scrollLeft + (pointX - wantX),
    scrollTop: root.scrollTop + (pointY - wantY),
  };
}

export function pdfZoomPageBoxes(root: HTMLElement): PdfZoomPageBox[] {
  const out: PdfZoomPageBox[] = [];
  const nodes = root.querySelectorAll("[data-page]");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!(node instanceof HTMLElement)) continue;
    const page = Number(node.getAttribute("data-page"));
    if (!Number.isFinite(page) || page < 1) continue;
    const r = node.getBoundingClientRect();
    out.push({
      page,
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
    });
  }
  return out;
}

export function capturePdfZoomAnchor(
  root: HTMLElement,
  clientX: number,
  clientY: number
): PdfZoomAnchor | null {
  const rect = root.getBoundingClientRect();
  return capturePdfZoomAnchorFromBoxes(
    rect.left,
    rect.top,
    pdfZoomPageBoxes(root),
    clientX,
    clientY
  );
}

export function applyPdfZoomAnchor(root: HTMLElement, anchor: PdfZoomAnchor) {
  const node = root.querySelector(`[data-page="${anchor.page}"]`);
  if (!(node instanceof HTMLElement)) return;
  const rootRect = root.getBoundingClientRect();
  const pageRect = node.getBoundingClientRect();
  const next = nextPdfZoomScroll(
    {
      page: anchor.page,
      left: pageRect.left,
      top: pageRect.top,
      width: pageRect.width,
      height: pageRect.height,
    },
    {
      left: rootRect.left,
      top: rootRect.top,
      scrollLeft: root.scrollLeft,
      scrollTop: root.scrollTop,
    },
    anchor
  );
  root.scrollLeft = next.scrollLeft;
  root.scrollTop = next.scrollTop;
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

/** Finger contacts only — Apple Pencil reports as stylus and must not pinch. */
export type PdfPinchTouch = {
  clientX: number;
  clientY: number;
  touchType?: string;
};

export function pdfPinchFingers<T extends PdfPinchTouch>(touches: ArrayLike<T>): T[] {
  const fingers: T[] = [];
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i]!;
    if (touch.touchType === "stylus" || touch.touchType === "pen") continue;
    fingers.push(touch);
  }
  return fingers;
}

export function pdfPinchDistance(a: PdfPinchTouch, b: PdfPinchTouch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function pdfPinchCentre(a: PdfPinchTouch, b: PdfPinchTouch): {
  x: number;
  y: number;
} {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

/** Ignore finger-spread jitter during two-finger pan so scroll stays put. */
export const PDF_PINCH_DEADZONE_RATIO = 0.06;
export const PDF_PINCH_DEADZONE_PX = 12;

export function isPdfPinch(originDist: number, currentDist: number): boolean {
  if (!(originDist > 0) || !(currentDist > 0)) return false;
  const delta = Math.abs(currentDist - originDist);
  if (delta < PDF_PINCH_DEADZONE_PX) return false;
  return Math.abs(currentDist / originDist - 1) >= PDF_PINCH_DEADZONE_RATIO;
}

export function nextPdfPinchScale(
  originScale: number,
  originDist: number,
  currentDist: number
): number {
  if (!(originDist > 0) || !(currentDist > 0)) return clampPdfScale(originScale);
  return clampPdfScale(originScale * (currentDist / originDist));
}
