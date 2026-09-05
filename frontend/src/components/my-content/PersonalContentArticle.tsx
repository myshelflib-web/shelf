"use client";

import type { MutableRefObject, ReactNode } from "react";
import type { UserContentHighlight } from "@/types";
import { DEFAULT_PEN_WIDTH } from "@/lib/straightenStroke";
import { HtmlHighlightLayer } from "./HtmlHighlightLayer";
import {
  highlightFromClientPoint,
  textHighlightFromEvent,
} from "./htmlHighlightGeometry";

type Pt = { x: number; y: number };

/** Article body + stroke layer + optional pen hit surface (PDF-style tools). */
export function PersonalContentArticle({
  originRef,
  setOrigin,
  setContentRoot,
  contentRootRef,
  fragment,
  highlights,
  eraseMode,
  highlightMode,
  clipMode,
  editing,
  contentScale,
  draft,
  preferredHighlightColorId,
  highlightWidth,
  highlightOpacity,
  onMarkActivate,
  onStrokeDown,
  onStrokeMove,
  onStrokeUp,
}: {
  originRef: MutableRefObject<HTMLElement | null>;
  setOrigin: (el: HTMLDivElement | null) => void;
  setContentRoot: (el: HTMLDivElement | null) => void;
  contentRootRef: MutableRefObject<HTMLElement | null>;
  fragment: string;
  highlights: UserContentHighlight[];
  eraseMode: boolean;
  highlightMode: boolean;
  clipMode: boolean;
  editing: boolean;
  contentScale: number;
  draft: Pt[];
  preferredHighlightColorId: string;
  highlightWidth?: number;
  highlightOpacity?: number;
  onMarkActivate: (
    highlight: UserContentHighlight,
    clientX: number,
    clientY: number
  ) => void;
  onStrokeDown: (e: React.PointerEvent) => void;
  onStrokeMove: (e: React.PointerEvent) => void;
  onStrokeUp: (e: React.PointerEvent) => void;
}): ReactNode {
  return (
    <div
      ref={setOrigin}
      className={`relative${highlightMode ? " html-article-pen-mode" : ""}`}
      style={
        contentScale !== 1
          ? { fontSize: `${Math.round(contentScale * 100)}%` }
          : undefined
      }
    >
      <HtmlHighlightLayer
        originRef={originRef}
        highlights={highlights}
        eraseMode={eraseMode}
        draftPoints={draft}
        draftColor={preferredHighlightColorId}
        draftWidth={highlightWidth ?? DEFAULT_PEN_WIDTH}
        draftOpacity={highlightOpacity ?? 0.72}
        onActivate={onMarkActivate}
      />
      <div
        ref={setContentRoot}
        className="prose-content personal-content select-text relative z-[1] bg-transparent"
        onClick={(e) => {
          if (clipMode || highlightMode || editing) return;
          const live = window.getSelection();
          if (live && !live.isCollapsed) return;
          const root = contentRootRef.current;
          const origin = originRef.current;
          if (!root || !origin) return;
          const hit =
            highlightFromClientPoint(
              e.clientX,
              e.clientY,
              origin,
              highlights
            ) ?? textHighlightFromEvent(e, root, highlights);
          if (hit) onMarkActivate(hit, e.clientX, e.clientY);
        }}
        dangerouslySetInnerHTML={{ __html: fragment }}
      />
      {/* Pen tool: capture strokes above prose (same idea as PDF pen mode). */}
      {highlightMode ? (
        <div
          className="absolute inset-0 z-[2] touch-none"
          style={{ cursor: "crosshair" }}
          onPointerDown={onStrokeDown}
          onPointerMove={onStrokeMove}
          onPointerUp={onStrokeUp}
          onPointerCancel={onStrokeUp}
        />
      ) : null}
    </div>
  );
}
