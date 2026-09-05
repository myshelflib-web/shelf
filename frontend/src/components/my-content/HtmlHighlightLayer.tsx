"use client";

import type { UserContentHighlight } from "@/types";
import {
  DEFAULT_PEN_WIDTH,
  penHitWidthPx,
  penStrokeWidthPx,
} from "@/lib/straightenStroke";
import { strokePointsFromRects } from "./htmlPageSelection";
import { isInkHighlight, penStroke, pointsToPath } from "./pdfViewerHelpers";

/** PDF highlighter strokes only — text highlights paint in the article. */
export function HtmlHighlightLayer({
  highlights,
  drawLocked,
  draftPoints,
  draftColor,
  draftWidth = DEFAULT_PEN_WIDTH,
  draftOpacity = 0.72,
  onActivate,
}: {
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
  const pointStrokes = highlights.filter((h) => h.position?.points?.length);
  const rectStrokes = highlights.filter(
    (h) =>
      h.position?.tool === "highlight" &&
      h.position.rects?.length &&
      !h.position.points?.length
  );

  return (
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
