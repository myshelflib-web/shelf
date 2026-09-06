"use client";

import { useLayoutEffect, useRef } from "react";
import type { UserContentHighlight } from "@/types";
import {
  applyHighlightsToElement,
  highlightPaintKey,
  unwrapHighlightMarks,
} from "@/lib/applyHighlights";
import { isWrappedTextHighlight } from "./htmlHighlightGeometry";

/**
 * Always wrap with <mark> — visible on light and dark app themes.
 * (CSS Custom Highlight API was unreliable here and easy to miss on dark UI.)
 */
export function useHtmlTextHighlightPaint(
  root: HTMLElement | null,
  highlights: UserContentHighlight[]
) {
  const paintKey = highlightPaintKey(highlights);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;

  useLayoutEffect(() => {
    if (!root) return;
    // Do not rewrite the DOM while the user is still selecting.
    const live = window.getSelection();
    if (live && !live.isCollapsed) return;

    const textHs = highlightsRef.current.filter(isWrappedTextHighlight);
    applyHighlightsToElement(root, textHs);
    return () => unwrapHighlightMarks(root);
    // paintKey is the visual signature; skip array-identity churn mid-drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- highlights via paintKey
  }, [root, paintKey]);
}
