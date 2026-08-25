"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  applyPdfZoomAnchor,
  capturePdfZoomAnchor,
  clampPdfScale,
  isPdfZoomWheel,
  nextPdfWheelScale,
  type PdfZoomAnchor,
} from "@/lib/pdfZoom";

type GestureLike = Event & {
  scale?: number;
  clientX?: number;
  clientY?: number;
};

/**
 * Zoom the PDF with trackpad pinch or Ctrl/Cmd + mouse wheel.
 * Anchors the point under the cursor so the page does not jump.
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
  const rafRef = useRef(0);

  useLayoutEffect(() => {
    const el = rootRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    anchorRef.current = null;
    applyPdfZoomAnchor(el, anchor);
  }, [scale]);

  useEffect(() => {
    if (!root) return;

    const commitScale = (next: number, clientX: number, clientY: number) => {
      const clamped = clampPdfScale(next);
      const from = laidOutScaleRef.current;
      if (clamped === from) return;
      anchorRef.current = capturePdfZoomAnchor(
        root,
        clientX,
        clientY,
        clamped / from
      );
      scaleRef.current = clamped;
      pendingScaleRef.current = clamped;
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        const pending = pendingScaleRef.current;
        if (pending != null) setScaleRef.current(pending);
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (!isPdfZoomWheel(e)) return;
      e.preventDefault();
      if (root.dataset.inkDrawing === "1") return;
      if (gestureActiveRef.current) return;
      commitScale(
        nextPdfWheelScale(scaleRef.current, e.deltaY, e.deltaMode),
        e.clientX,
        e.clientY
      );
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
      commitScale(
        gestureOriginRef.current * ge.scale,
        ge.clientX ?? 0,
        ge.clientY ?? 0
      );
    };

    const onGestureEnd = (e: Event) => {
      e.preventDefault();
      gestureActiveRef.current = false;
    };

    const gestureOpts: AddEventListenerOptions = { passive: false };
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("gesturestart", onGestureStart, gestureOpts);
    root.addEventListener("gesturechange", onGestureChange, gestureOpts);
    root.addEventListener("gestureend", onGestureEnd, gestureOpts);
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("gesturestart", onGestureStart);
      root.removeEventListener("gesturechange", onGestureChange);
      root.removeEventListener("gestureend", onGestureEnd);
    };
  }, [root]);
}
