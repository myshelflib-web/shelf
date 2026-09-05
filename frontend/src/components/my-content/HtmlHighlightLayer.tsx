"use client";

import { useLayoutEffect, useState, type MutableRefObject } from "react";
import type { UserContentHighlight } from "@/types";
import { DEFAULT_PEN_WIDTH } from "@/lib/straightenStroke";
import { strokePointsFromRects } from "./htmlPageSelection";
import { isInkHighlight, penStroke } from "./pdfViewerHelpers";

/** Map PDF page-fraction widths to a thin HTML marker (XS ≈ 7px, L ≈ 16px). */
function htmlStrokePx(width: number): number {
  return Math.round(Math.min(18, Math.max(6, width * 2800)));
}

function pathFromNorm(
  points: Array<{ x: number; y: number }>,
  w: number,
  h: number
): string {
  if (!points.length) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * w} ${p.y * h}`)
    .join(" ");
}

function isStrokeHighlight(h: UserContentHighlight): boolean {
  return Boolean(h.position?.points?.length) ||
    (h.position?.tool === "highlight" && Boolean(h.position.rects?.length));
}

export function hasHtmlStrokes(highlights: UserContentHighlight[]): boolean {
  return highlights.some(isStrokeHighlight);
}

/** Pixel-space SVG behind the article — never a covering hit target. */
export function HtmlHighlightLayer({
  originRef,
  highlights,
  eraseMode,
  draftPoints,
  draftColor,
  draftWidth = DEFAULT_PEN_WIDTH,
  draftOpacity = 0.72,
  onActivate,
}: {
  originRef: MutableRefObject<HTMLElement | null>;
  highlights: UserContentHighlight[];
  eraseMode: boolean;
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
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = originRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(0, r.width), h: Math.max(0, r.height) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [originRef]);

  const pointStrokes = highlights.filter((h) => h.position?.points?.length);
  const rectStrokes = highlights.filter(
    (h) =>
      h.position?.tool === "highlight" &&
      h.position.rects?.length &&
      !h.position.points?.length
  );
  const { w, h } = size;
  if (w < 1 || h < 1) return null;

  return (
    <svg
      aria-hidden
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`absolute top-0 left-0 ${eraseMode ? "z-[2]" : "z-0"}`}
      style={{ pointerEvents: "none", overflow: "visible" }}
    >
      {pointStrokes.map((hl) => (
        <StrokeMark
          key={hl.id}
          highlight={hl}
          d={pathFromNorm(hl.position!.points!, w, h)}
          eraseMode={eraseMode}
          onActivate={onActivate}
        />
      ))}
      {rectStrokes.flatMap((hl) =>
        strokePointsFromRects(hl.position!.rects ?? []).map((pts, i) => (
          <StrokeMark
            key={`${hl.id}-r${i}`}
            highlight={hl}
            d={pathFromNorm(pts, w, h)}
            eraseMode={eraseMode}
            onActivate={onActivate}
          />
        ))
      )}
      {draftPoints && draftPoints.length > 1 ? (
        <path
          d={pathFromNorm(draftPoints, w, h)}
          fill="none"
          stroke={penStroke(draftColor, draftOpacity)}
          strokeWidth={htmlStrokePx(draftWidth)}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="html-pen-stroke"
        />
      ) : null}
    </svg>
  );
}

function StrokeMark({
  highlight,
  d,
  eraseMode,
  onActivate,
}: {
  highlight: UserContentHighlight;
  d: string;
  eraseMode: boolean;
  onActivate: (
    highlight: UserContentHighlight,
    clientX: number,
    clientY: number
  ) => void;
}) {
  const px = htmlStrokePx(highlight.position?.width ?? DEFAULT_PEN_WIDTH);
  return (
    <g
      style={{ pointerEvents: eraseMode ? "stroke" : "none" }}
      onClick={(e) => {
        if (!eraseMode) return;
        e.stopPropagation();
        onActivate(highlight, e.clientX, e.clientY);
      }}
    >
      {eraseMode ? (
        <path
          d={d}
          fill="none"
          stroke="transparent"
          strokeWidth={px + 10}
          strokeLinecap="round"
        />
      ) : null}
      <path
        d={d}
        fill="none"
        className="html-pen-stroke"
        stroke={
          isInkHighlight(highlight)
            ? highlight.position?.color || highlight.color
            : penStroke(highlight.color, highlight.position?.opacity ?? 0.72)
        }
        strokeWidth={px}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
