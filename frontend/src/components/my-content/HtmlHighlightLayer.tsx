"use client";

import { useLayoutEffect, useState } from "react";
import type { UserContentHighlight } from "@/types";
import {
  DEFAULT_PEN_WIDTH,
  penHitWidthPx,
  penStrokeWidthPx,
} from "@/lib/straightenStroke";
import { overlayBoxesForHighlights, type OverlayBox } from "./htmlHighlightGeometry";
import { strokePointsFromRects } from "./htmlPageSelection";
import { isInkHighlight, penStroke, pointsToPath } from "./pdfViewerHelpers";

/** PDF-style marks: percent rects + pen strokes. Never wraps article text. */
export function HtmlHighlightLayer({
  contentEl,
  originEl,
  highlights,
  drawLocked,
  draftPoints,
  draftColor,
  draftWidth = DEFAULT_PEN_WIDTH,
  draftOpacity = 0.72,
  onActivate,
}: {
  contentEl: HTMLElement | null;
  originEl: HTMLElement | null;
  highlights: UserContentHighlight[];
  drawLocked: boolean;
  draftPoints?: Array<{ x: number; y: number }>;
  draftColor: string;
  draftWidth?: number;
  draftOpacity?: number;
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

  const pointStrokes = highlights.filter((h) => h.position?.points?.length);
  const rectStrokes = highlights.filter(
    (h) =>
      h.position?.tool === "highlight" &&
      h.position.rects?.length &&
      !h.position.points?.length
  );
  const rectMarks = highlights.filter(
    (h) =>
      h.position?.rects?.length &&
      h.position.tool !== "highlight"
  );

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
        {pointStrokes.map((h) => (
          <StrokeMark
            key={h.id}
            highlight={h}
            points={h.position!.points!}
            drawLocked={drawLocked}
            onActivate={onActivate}
          />
        ))}
        {rectStrokes.flatMap((h) =>
          strokePointsFromRects(h.position!.rects ?? []).map((pts, i) => (
            <StrokeMark
              key={`${h.id}-r${i}`}
              highlight={h}
              points={pts}
              drawLocked={drawLocked}
              onActivate={onActivate}
            />
          ))
        )}
        {draftPoints && draftPoints.length > 1 ? (
          <path
            className="pdf-pen-stroke"
            d={pointsToPath(draftPoints)}
            stroke={penStroke(draftColor, draftOpacity)}
            strokeWidth={penStrokeWidthPx(draftWidth)}
            vectorEffect="nonScalingStroke"
            style={{ pointerEvents: "none" }}
          />
        ) : null}
      </svg>
    </>
  );
}

function StrokeMark({
  highlight,
  points,
  drawLocked,
  onActivate,
}: {
  highlight: UserContentHighlight;
  points: Array<{ x: number; y: number }>;
  drawLocked: boolean;
  onActivate: (
    highlight: UserContentHighlight,
    clientX: number,
    clientY: number
  ) => void;
}) {
  const width = highlight.position?.width ?? DEFAULT_PEN_WIDTH;
  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        if (drawLocked) return;
        e.stopPropagation();
        onActivate(highlight, e.clientX, e.clientY);
      }}
    >
      <path
        d={pointsToPath(points)}
        fill="none"
        stroke="transparent"
        strokeWidth={penHitWidthPx(width)}
        strokeLinecap="round"
        vectorEffect="nonScalingStroke"
        style={{ pointerEvents: drawLocked ? "none" : "stroke" }}
      />
      <path
        className={isInkHighlight(highlight) ? "pdf-ink-stroke" : "pdf-pen-stroke"}
        d={pointsToPath(points)}
        stroke={
          isInkHighlight(highlight)
            ? highlight.position?.color || highlight.color
            : penStroke(highlight.color, highlight.position?.opacity ?? 0.72)
        }
        strokeWidth={penStrokeWidthPx(width)}
        vectorEffect="nonScalingStroke"
        style={{ pointerEvents: "none" }}
      />
    </g>
  );
}
