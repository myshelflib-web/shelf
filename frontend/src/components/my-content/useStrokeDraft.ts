"use client";

import { useRef, type RefObject } from "react";
import { pointsToPath, type BlankPt } from "@/lib/blankCanvas";

/**
 * In-progress stroke drawn straight into the DOM. Holding points in React
 * state re-renders every committed path on each move, which a stylus outpaces.
 */
export function useStrokeDraft(strokePts: RefObject<BlankPt[]>) {
  const draftPathRef = useRef<SVGPathElement>(null);
  const draftFrame = useRef<number | null>(null);

  const paintDraft = (pts: BlankPt[] | null) => {
    if (draftFrame.current !== null) {
      cancelAnimationFrame(draftFrame.current);
      draftFrame.current = null;
    }
    const el = draftPathRef.current;
    if (!el) return;
    el.setAttribute("d", pts && pts.length > 1 ? pointsToPath(pts) : "");
  };

  /** Repaint at most once per frame regardless of how fast points arrive. */
  const schedulePaintDraft = () => {
    if (draftFrame.current !== null) return;
    draftFrame.current = requestAnimationFrame(() => {
      draftFrame.current = null;
      paintDraft(strokePts.current);
    });
  };

  return { draftPathRef, paintDraft, schedulePaintDraft };
}
