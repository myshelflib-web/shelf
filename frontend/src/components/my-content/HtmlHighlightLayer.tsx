"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { UserContentHighlight } from "@/types";
import {
  overlayBoxesForHighlights,
  type OverlayBox,
} from "./htmlHighlightGeometry";

const COLOR_VAR: Record<string, string> = {
  yellow: "var(--highlight-yellow)",
  green: "var(--highlight-green)",
  blue: "var(--highlight-blue)",
  pink: "var(--highlight-pink)",
  orange: "#e59866",
};

/** Non-interactive highlight paint — text nodes stay untouched so selection works. */
export function HtmlHighlightLayer({
  contentEl,
  originEl,
  highlights,
  paintKey,
  onBoxes,
}: {
  contentEl: HTMLElement | null;
  originEl: HTMLElement | null;
  highlights: UserContentHighlight[];
  paintKey: string;
  onBoxes?: (boxes: OverlayBox[]) => void;
}) {
  const onBoxesRef = useRef(onBoxes);
  onBoxesRef.current = onBoxes;
  const [boxes, setBoxes] = useState<OverlayBox[]>([]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!contentEl || !originEl) {
        setBoxes([]);
        onBoxesRef.current?.([]);
        return;
      }
      const next = overlayBoxesForHighlights(
        contentEl,
        originEl.getBoundingClientRect(),
        highlights
      );
      setBoxes(next);
        onBoxesRef.current?.(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (originEl) ro.observe(originEl);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [contentEl, originEl, highlights, paintKey]);

  return (
    <div
      className="html-hl-layer absolute inset-0 pointer-events-none z-[1]"
      aria-hidden
    >
      {boxes.map((b, i) => (
        <div
          key={`${b.id}-${i}`}
          className="html-hl-box absolute rounded-sm"
          style={{
            left: b.left,
            top: b.top,
            width: b.width,
            height: b.height,
            background: COLOR_VAR[b.color] ?? COLOR_VAR.yellow,
          }}
        />
      ))}
    </div>
  );
}
