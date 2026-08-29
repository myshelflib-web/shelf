"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import { flushSync } from "react-dom";
import {
  applyPdfVisualZoom,
  applyPdfZoomAnchor,
  capturePdfZoomAnchor,
  clearPdfVisualZoom,
  clampPdfScale,
  isPdfZoomWheel,
  nextPdfWheelScale,
  pdfVisualZoomOrigin,
  pdfZoomContentEl,
  PDF_ZOOM_COMMIT_MS,
  type PdfZoomAnchor,
} from "@/lib/pdfZoom";

type GestureLike = Event & {
  scale?: number;
  clientX?: number;
  clientY?: number;
};

/**
 * Zoom the PDF with trackpad pinch or Ctrl/Cmd + mouse wheel.
 * CSS-scales during the gesture; PDF.js canvases re-render after it settles.
 */
export function usePdfWheelZoom(
  root: HTMLElement | null,
  scale: number,
  setScale: Dispatch<SetStateAction<number>>
) {
  const pendingScaleRef = useRef<number | null>(null);
  const scaleRef = useRef(scale);
  if (pendingScaleRef.current == null || pendingScaleRef.current === scale) {
    pendingScaleRef.current = null;
    scaleRef.current = scale;
  }
  const laidOutScaleRef = useRef(scale);
  laidOutScaleRef.current = scale;
  const setScaleRef = useRef(setScale);
  setScaleRef.current = setScale;
  const rootRef = useRef(root);
  rootRef.current = root;
  const anchorRef = useRef<PdfZoomAnchor | null>(null);
  const gestureOriginRef = useRef(1);
  const gestureActiveRef = useRef(false);
  const liveOriginRef = useRef<{ x: number; y: number } | null>(null);
  const lastClientRef = useRef({ x: 0, y: 0 });
  const commitTimerRef = useRef(0);

  useLayoutEffect(() => {
    const el = rootRef.current;
    const content = el ? pdfZoomContentEl(el) : null;
    if (content) clearPdfVisualZoom(content);
    liveOriginRef.current = null;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    anchorRef.current = null;
    applyPdfZoomAnchor(el, anchor);
  }, [scale]);

  useEffect(() => {
    if (!root) return;

    const paintVisual = (next: number, clientX: number, clientY: number) => {
      const content = pdfZoomContentEl(root);
      if (!content) return;
      const from = laidOutScaleRef.current;
      const clamped = clampPdfScale(next);
      scaleRef.current = clamped;
      pendingScaleRef.current = clamped;
      lastClientRef.current = { x: clientX, y: clientY };
      if (!liveOriginRef.current) {
        liveOriginRef.current = pdfVisualZoomOrigin(content, clientX, clientY);
      }
      const origin = liveOriginRef.current;
      applyPdfVisualZoom(content, origin.x, origin.y, clamped / from);
    };

    const commit = (sync: boolean) => {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = 0;
      const pending = pendingScaleRef.current;
      if (pending == null) return;
      const from = laidOutScaleRef.current;
      if (pending === from) {
        const content = pdfZoomContentEl(root);
        if (content) clearPdfVisualZoom(content);
        liveOriginRef.current = null;
        pendingScaleRef.current = null;
        return;
      }
      const { x, y } = lastClientRef.current;
      anchorRef.current = capturePdfZoomAnchor(root, x, y, pending / from);
      const apply = () => setScaleRef.current(pending);
      if (sync) flushSync(apply);
      else apply();
    };

    const scheduleCommit = () => {
      window.clearTimeout(commitTimerRef.current);
      commitTimerRef.current = window.setTimeout(
        () => commit(false),
        PDF_ZOOM_COMMIT_MS
      );
    };

    const onWheel = (e: WheelEvent) => {
      if (!isPdfZoomWheel(e)) return;
      e.preventDefault();
      if (root.dataset.inkDrawing === "1") return;
      if (gestureActiveRef.current) return;
      paintVisual(
        nextPdfWheelScale(scaleRef.current, e.deltaY, e.deltaMode),
        e.clientX,
        e.clientY
      );
      scheduleCommit();
    };

    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureActiveRef.current = true;
      gestureOriginRef.current = scaleRef.current;
    };

    const onGestureChange = (e: Event) => {
      e.preventDefault();
      if (root.dataset.inkDrawing === "1") return;
      const ge = e as GestureLike;
      if (typeof ge.scale !== "number" || !Number.isFinite(ge.scale)) return;
      paintVisual(
        gestureOriginRef.current * ge.scale,
        ge.clientX ?? lastClientRef.current.x,
        ge.clientY ?? lastClientRef.current.y
      );
      scheduleCommit();
    };

    const onGestureEnd = (e: Event) => {
      e.preventDefault();
      gestureActiveRef.current = false;
      commit(false);
    };

    const onPointerDown = () => {
      if (gestureActiveRef.current) return;
      if (pendingScaleRef.current == null) return;
      if (pendingScaleRef.current === laidOutScaleRef.current) return;
      commit(true);
    };

    const gestureOpts: AddEventListenerOptions = { passive: false };
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("gesturestart", onGestureStart, gestureOpts);
    root.addEventListener("gesturechange", onGestureChange, gestureOpts);
    root.addEventListener("gestureend", onGestureEnd, gestureOpts);
    root.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      window.clearTimeout(commitTimerRef.current);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("gesturestart", onGestureStart);
      root.removeEventListener("gesturechange", onGestureChange);
      root.removeEventListener("gestureend", onGestureEnd);
      root.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [root]);
}
