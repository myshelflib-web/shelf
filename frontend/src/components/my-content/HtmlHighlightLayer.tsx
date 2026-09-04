"use client";

import { useLayoutEffect, useState } from "react";
import type { UserContentHighlight } from "@/types";
import {
  DEFAULT_PEN_WIDTH,
  penHitWidthPx,
  penStrokeWidthPx,
} from "@/lib/straightenStroke";
import { overlayBoxesForHighlights, type OverlayBox } from "./htmlHighlightGeometry";
import { isInkHighlight, penStroke, pointsToPath } from "./pdfViewerHelpers";

/** PDF-style marks: percent rects + pen strokes. Never wraps article text. */
export function HtmlHighlightLayer({
  contentEl,
  originEl,
  highlights,
  drawLocked,
  draftPoints,
  draftColor,
  onActivate,
}: {
  contentEl: HTMLElement | null;
  originEl: HTMLElement | null;
  highlights: UserContentHighlight[];
  drawLocked: boolean;
  draftPoints?: Array<{ x: number; y: number }>;
  draftColor: string;
  onActivate: (
    highlight: UserContentHighlight,
    clientX: number,
    clientY: number
  ) => void;
}) {
  const [fallback, setFallback] = useState<OverlayBox[]>([]);

  useLayoutEffect(() => {
    if (!contentEl || !originEl) {
      setFallback([]);
      return;
    }
    const needsMeasure = highlights.filter(
      (h) =>
        (!h.kind || h.kind === "TEXT") &&
        !h.position?.rects?.length &&
        !h.position?.points?.length &&
        h.endOffset > h.startOffset
    );
    if (!needsMeasure.length) {
      setFallback([]);
      return;
    }
    setFallback(
      overlayBoxesForHighlights(
        contentEl,
        originEl.getBoundingClientRect(),
        needsMeasure
      )
    );
  }, [contentEl, originEl, highlights]);

  const strokes = highlights.filter((h) => h.position?.points?.length);
  const rectMarks = highlights.filter((h) => h.position?.rects?.length);

  return (
    <>
      {rectMarks.flatMap((h) =>
        (h.position!.rects ?? []).map((box, idx) => (
          <div
            key={`${h.id}-${idx}`}
            role="button"
            tabIndex={0}
            title="Click for highlight options"
            className={`pdf-highlight-overlay highlight-${h.color}${
              h.note?.trim() ? " has-note" : ""
            }`}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.w * 100}%`,
              height: `${box.h * 100}%`,
              pointerEvents: drawLocked ? "none" : "auto",
            }}
            onClick={(e) => {
              if (drawLocked) return;
              e.stopPropagation();
              onActivate(h, e.clientX, e.clientY);
            }}
          />
        ))
      )}
      {fallback.map((b, i) => {
        const h = highlights.find((x) => x.id === b.id);
        if (!h) return null;
        return (
          <div
            key={`fb-${b.id}-${i}`}
            role="button"
            tabIndex={0}
            title="Click for highlight options"
            className={`pdf-highlight-overlay highlight-${h.color}${
              h.note?.trim() ? " has-note" : ""
            }`}
            style={{
              left: b.left,
              top: b.top,
              width: b.width,
              height: b.height,
              pointerEvents: drawLocked ? "none" : "auto",
            }}
            onClick={(e) => {
              if (drawLocked) return;
              e.stopPropagation();
              onActivate(h, e.clientX, e.clientY);
            }}
          />
        );
      })}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ pointerEvents: "none" }}
      >
        {strokes.map((h) => (
          <g
            key={h.id}
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              if (drawLocked) return;
              e.stopPropagation();
              onActivate(h, e.clientX, e.clientY);
            }}
          >
            <path
              d={pointsToPath(h.position!.points!)}
              fill="none"
              stroke="transparent"
              strokeWidth={penHitWidthPx(h.position?.width ?? DEFAULT_PEN_WIDTH)}
              strokeLinecap="round"
              vectorEffect="nonScalingStroke"
              style={{ pointerEvents: drawLocked ? "none" : "stroke" }}
            />
            <path
              className={
                isInkHighlight(h) ? "pdf-ink-stroke" : "pdf-pen-stroke"
              }
              d={pointsToPath(h.position!.points!)}
              stroke={
                isInkHighlight(h)
                  ? h.position?.color || h.color
                  : penStroke(h.color, h.position?.opacity ?? 0.72)
              }
              strokeWidth={penStrokeWidthPx(
                h.position?.width ?? DEFAULT_PEN_WIDTH
              )}
              vectorEffect="nonScalingStroke"
              style={{ pointerEvents: "none" }}
            />
          </g>
        ))}
        {draftPoints && draftPoints.length > 1 ? (
          <path
            className="pdf-pen-stroke"
            d={pointsToPath(draftPoints)}
            stroke={penStroke(draftColor, 0.72)}
            strokeWidth={penStrokeWidthPx(DEFAULT_PEN_WIDTH)}
            vectorEffect="nonScalingStroke"
            style={{ pointerEvents: "none" }}
          />
        ) : null}
      </svg>
    </>
  );
}
