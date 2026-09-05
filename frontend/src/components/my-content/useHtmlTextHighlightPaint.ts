"use client";

import { useLayoutEffect } from "react";
import type { UserContentHighlight } from "@/types";
import {
  applyHighlightsToElement,
  highlightPaintKey,
  rangeFromTextOffsets,
  unwrapHighlightMarks,
} from "@/lib/applyHighlights";
import { isWrappedTextHighlight } from "./htmlHighlightGeometry";

const CSS_HL = [
  "yellow",
  "green",
  "blue",
  "pink",
  "orange",
] as const;

function cssHighlightApi(): {
  set: (name: string, highlight: Highlight) => void;
  delete: (name: string) => void;
} | null {
  try {
    const api = (CSS as typeof CSS & { highlights?: HighlightRegistry })
      .highlights;
    return api ?? null;
  } catch {
    return null;
  }
}

/**
 * Hypothesis / Medium style: never rewrite article HTML.
 * Chrome: CSS Custom Highlight API. Others: wrap the live Range in <mark>.
 */
export function useHtmlTextHighlightPaint(
  root: HTMLElement | null,
  highlights: UserContentHighlight[]
) {
  const paintKey = highlightPaintKey(highlights);

  useLayoutEffect(() => {
    if (!root) return;
    const textHs = highlights.filter(isWrappedTextHighlight);
    const api = cssHighlightApi();

    if (api) {
      unwrapHighlightMarks(root);
      const names: string[] = [];
      for (const color of CSS_HL) {
        const ranges: Range[] = [];
        for (const h of textHs) {
          if ((h.color || "yellow") !== color) continue;
          const range = rangeFromTextOffsets(root, h.startOffset, h.endOffset);
          if (range) ranges.push(range);
        }
        const name = `shelf-hl-${color}`;
        names.push(name);
        if (ranges.length) api.set(name, new Highlight(...ranges));
        else api.delete(name);
      }
      return () => {
        for (const name of names) api.delete(name);
      };
    }

    applyHighlightsToElement(root, textHs);
    return () => unwrapHighlightMarks(root);
  }, [root, highlights, paintKey]);
}
