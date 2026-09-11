"use client";

import type { MutableRefObject, PointerEvent as ReactPointerEvent } from "react";
import type { BlankStroke } from "@/lib/blankCanvas";
import { canvasBgTone, canvasFgColor } from "@/lib/blankCanvas";
import {
  SKETCH_PAGE_H,
  SKETCH_PAGE_W,
  sketchTemplateClass,
  type SketchImage,
  type SketchTemplate,
} from "@/lib/sketchNotebook";

type Props = {
  surfaceRef: MutableRefObject<HTMLDivElement | null>;
  scale: number;
  bg: string;
  template: SketchTemplate;
  images: SketchImage[];
  paths: BlankStroke[];
  penColor: string;
  penSize: number;
  draftPathRef: MutableRefObject<SVGPathElement | null>;
  bindLiveGroup: (page: number, el: SVGGElement | null) => void;
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
};

/** Scaled A4 sketch sheet with images under the ink layer. */
export function SketchPageSurface({
  surfaceRef,
  scale,
  bg,
  template,
  images,
  paths,
  penColor,
  penSize,
  draftPathRef,
  bindLiveGroup,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  return (
    <div
      data-page={1}
      className="relative shrink-0 overflow-hidden"
      style={{
        width: SKETCH_PAGE_W * scale,
        height: SKETCH_PAGE_H * scale,
      }}
    >
      <div
        ref={surfaceRef}
        className={`shelf-sketch-page sketch-page-sheet ${sketchTemplateClass(template)}`}
        data-template={template}
        data-bg={bg}
        data-bg-tone={canvasBgTone(bg)}
        data-w={SKETCH_PAGE_W}
        data-h={SKETCH_PAGE_H}
        style={{
          width: SKETCH_PAGE_W,
          height: SKETCH_PAGE_H,
          backgroundColor: bg,
          color: canvasFgColor(bg),
          transform: Math.abs(scale - 1) < 0.0001 ? undefined : `scale(${scale})`,
          transformOrigin: "top left",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {images.map((img) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            className="shelf-sketch-image"
            src={img.src}
            alt=""
            draggable={false}
            style={{
              left: img.x,
              top: img.y,
              width: img.w,
              height: img.h,
            }}
          />
        ))}
        <svg
          className="blank-draw-layer"
          width={SKETCH_PAGE_W}
          height={SKETCH_PAGE_H}
          viewBox={`0 0 ${SKETCH_PAGE_W} ${SKETCH_PAGE_H}`}
        >
          {paths.map((p, i) => (
            <path
              key={i}
              className="blank-draw-stroke"
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth={p.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          <g ref={(el) => bindLiveGroup(0, el)} aria-hidden />
          <path
            ref={draftPathRef}
            className="blank-draw-stroke opacity-80"
            fill="none"
            stroke={penColor}
            strokeWidth={penSize}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
