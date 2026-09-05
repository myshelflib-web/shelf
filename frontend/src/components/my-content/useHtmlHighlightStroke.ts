"use client";

import { useCallback, useRef, useState, type MutableRefObject } from "react";
import { straightenStroke } from "@/lib/straightenStroke";

type Pt = { x: number; y: number };

function localPoint(
  origin: HTMLElement | null,
  clientX: number,
  clientY: number
): Pt | null {
  if (!origin) return null;
  const r = origin.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    x: (clientX - r.left) / r.width,
    y: (clientY - r.top) / r.height,
  };
}

/** PDF highlighter: drag a stroke on the article wrap (normalized 0–1). */
export function useHtmlHighlightStroke(
  originRef: MutableRefObject<HTMLElement | null>,
  enabled: boolean,
  onComplete: (points: Pt[]) => void
) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const drawing = useRef(false);
  const pointsRef = useRef<Pt[]>([]);
  const [draft, setDraft] = useState<Pt[]>([]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return;
      const pt = localPoint(originRef.current, e.clientX, e.clientY);
      if (!pt) return;
      e.preventDefault();
      drawing.current = true;
      pointsRef.current = [pt];
      setDraft([pt]);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [enabled, originRef]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || !drawing.current) return;
      const pt = localPoint(originRef.current, e.clientX, e.clientY);
      if (!pt) return;
      const last = pointsRef.current[pointsRef.current.length - 1];
      if (last) {
        const dx = pt.x - last.x;
        const dy = pt.y - last.y;
        if (dx * dx + dy * dy < 0.000004) return;
      }
      pointsRef.current = [...pointsRef.current, pt];
      setDraft(pointsRef.current);
    },
    [enabled, originRef]
  );

  const endStroke = useCallback(() => {
    if (!drawing.current) return;
    drawing.current = false;
    const raw = pointsRef.current;
    pointsRef.current = [];
    setDraft([]);
    if (raw.length < 2) return;
    onCompleteRef.current(straightenStroke(raw));
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* not captured */
      }
      endStroke();
    },
    [enabled, endStroke]
  );

  return { draft, onPointerDown, onPointerMove, onPointerUp };
}
