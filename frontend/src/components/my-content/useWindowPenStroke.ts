"use client";

import { useCallback, useRef } from "react";
import { shouldPreventInkPointerDown } from "@/lib/inkSurface";

type Pt = { x: number; y: number };

type StrokeStyle = {
  stroke: string;
  strokeWidth: number;
  className: string;
};

/**
 * Cross-platform stylus strokes (Apple Pencil + Samsung S Pen).
 *
 * Move/up are taken from `window` so a React re-render after saving cannot
 * drop the active stroke. We deliberately skip `setPointerCapture` and do
 * not end on `pointercancel` — both cause Chrome-on-Android (S Pen) to kill
 * the tip-down → lift → tip-down loop.
 */
export function useWindowPenStroke() {
  const activeId = useRef<number | null>(null);
  const drawing = useRef(false);
  const points = useRef<Pt[]>([]);
  const localizer = useRef<(clientX: number, clientY: number) => Pt | null>(
    () => null
  );
  const onPaint = useRef<(pts: Pt[]) => void>(() => {});
  const onFinish = useRef<(pts: Pt[]) => void>(() => {});
  const frame = useRef<number | null>(null);
  const liveGroups = useRef<Map<number, SVGGElement>>(new Map());
  const detachWindow = useRef<() => void>(() => {});

  const bindLiveGroup = useCallback((page: number, el: SVGGElement | null) => {
    if (el) liveGroups.current.set(page, el);
    else liveGroups.current.delete(page);
  }, []);

  const stopWindow = useCallback(() => {
    detachWindow.current();
    detachWindow.current = () => {};
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
  }, []);

  const paint = useCallback(() => {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      onPaint.current(points.current);
    });
  }, []);

  const append = useCallback((pt: Pt) => {
    const last = points.current[points.current.length - 1];
    if (last) {
      const dx = pt.x - last.x;
      const dy = pt.y - last.y;
      // Normalized (PDF) and pixel (notebook) coords both skip true duplicates.
      if (dx * dx + dy * dy < 1e-12) return;
    }
    points.current.push(pt);
  }, []);

  const promoteLive = useCallback(
    (page: number, d: string, style: StrokeStyle): SVGPathElement | null => {
      const g = liveGroups.current.get(page);
      if (!g || !d) return null;
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", style.stroke);
      path.setAttribute("stroke-width", String(style.strokeWidth));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("class", style.className);
      path.setAttribute("vector-effect", "nonScalingStroke");
      path.style.pointerEvents = "none";
      g.appendChild(path);
      return path;
    },
    []
  );

  const clearLive = useCallback((page: number, path?: SVGPathElement | null) => {
    if (path) {
      path.remove();
      return;
    }
    const g = liveGroups.current.get(page);
    if (g) g.replaceChildren();
  }, []);

  const endStroke = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    activeId.current = null;
    stopWindow();
    const pts = points.current;
    points.current = [];
    onPaint.current([]);
    onFinish.current(pts);
  }, [stopWindow]);

  const beginStroke = useCallback(
    (opts: {
      pointerId: number;
      page: number;
      start: Pt;
      localize: (clientX: number, clientY: number) => Pt | null;
      paint: (pts: Pt[]) => void;
      finish: (pts: Pt[]) => void;
    }) => {
      // Commit any stuck stroke (cancel-without-up) so the new tip-down works.
      if (drawing.current) endStroke();
      drawing.current = true;
      activeId.current = opts.pointerId;
      points.current = [opts.start];
      localizer.current = opts.localize;
      onPaint.current = opts.paint;
      onFinish.current = opts.finish;
      opts.paint(points.current);

      const onMove = (e: PointerEvent) => {
        if (!drawing.current || e.pointerId !== activeId.current) return;
        if (e.cancelable) e.preventDefault();
        const coalesced = e.getCoalescedEvents?.();
        const list =
          coalesced && coalesced.length > 0
            ? coalesced
            : [{ clientX: e.clientX, clientY: e.clientY }];
        for (const s of list) {
          const pt = localizer.current(s.clientX, s.clientY);
          if (pt) append(pt);
        }
        paint();
      };

      const onUp = (e: PointerEvent) => {
        if (!drawing.current || e.pointerId !== activeId.current) return;
        if (e.cancelable && shouldPreventInkPointerDown(e)) e.preventDefault();
        const pt = localizer.current(e.clientX, e.clientY);
        if (pt) append(pt);
        endStroke();
      };

      // pointercancel is ignored on purpose: Chrome + S Pen / iPadOS palm
      // rejection fires it while the tip is still down. Ending here makes the
      // rest of the stroke (and often the next tip-down) feel dead. A real
      // lift always sends pointerup; a stuck stroke is recovered on the next
      // beginStroke.
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp, { passive: false });
      detachWindow.current = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
    },
    [append, endStroke, paint]
  );

  const isDrawing = () => drawing.current;
  const activePointerId = () => activeId.current;

  return {
    beginStroke,
    endStroke,
    isDrawing,
    activePointerId,
    bindLiveGroup,
    promoteLive,
    clearLive,
  };
}
