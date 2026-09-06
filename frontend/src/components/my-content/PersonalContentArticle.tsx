"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { UserContentHighlight } from "@/types";
import { DEFAULT_PEN_WIDTH } from "@/lib/straightenStroke";
import { isReadOnlyDocHtml, parseDocBody } from "@/lib/docEditor";
import { HtmlHighlightLayer } from "./HtmlHighlightLayer";
import {
  highlightFromClientPoint,
  textHighlightFromEvent,
} from "./htmlHighlightGeometry";

type Pt = { x: number; y: number };

function blockDocEdit(e: { preventDefault: () => void }) {
  e.preventDefault();
}

function allowDocShortcut(e: {
  metaKey: boolean;
  ctrlKey: boolean;
  key: string;
}): boolean {
  if (!(e.metaKey || e.ctrlKey)) return false;
  const k = e.key.toLowerCase();
  return k === "c" || k === "a";
}

/**
 * Article body + highlight overlays under the text (z-0).
 * Read-only curriculum Docs use a contentEditable surface (like live Docs)
 * so native drag-select works; edits are blocked.
 */
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
  const readOnlyDoc = isReadOnlyDocHtml(fragment);
  const docBodyInner = readOnlyDoc ? parseDocBody(fragment) : "";
  const docBodyRef = useRef<HTMLDivElement | null>(null);
  const seededFor = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (!readOnlyDoc) {
      seededFor.current = null;
      return;
    }
    const el = docBodyRef.current;
    if (!el) return;
    // Seed like DocEditor — do not rewrite while marks/selection are live.
    if (seededFor.current === fragment) return;
    seededFor.current = fragment;
    el.innerHTML = docBodyInner;
  }, [readOnlyDoc, fragment, docBodyInner]);

  const bindContentRoot = useCallback(
    (el: HTMLDivElement | null) => {
      docBodyRef.current = readOnlyDoc ? el : null;
      setContentRoot(el);
    },
    [readOnlyDoc, setContentRoot]
  );

  const onArticleClick = (e: React.MouseEvent) => {
    if (clipMode || highlightMode || editing) return;
    const live = window.getSelection();
    if (live && !live.isCollapsed) return;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return;
    const hit =
      highlightFromClientPoint(e.clientX, e.clientY, origin, highlights) ??
      textHighlightFromEvent(e, root, highlights);
    if (hit) onMarkActivate(hit, e.clientX, e.clientY);
  };

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
      {/* Under the article so SVG/rects never steal drag-select. */}
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
      {readOnlyDoc ? (
        <div className="shelf-doc-editor shelf-doc-readonly relative z-[2]">
          <div
            ref={bindContentRoot}
            className="shelf-doc-body prose-content personal-content select-text outline-none"
            data-shelf-readonly="1"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onBeforeInput={blockDocEdit}
            onPaste={blockDocEdit}
            onCut={blockDocEdit}
            onDrop={blockDocEdit}
            onKeyDown={(e) => {
              if (allowDocShortcut(e)) return;
              // Keep navigation / modifiers; block typing that would edit.
              if (
                e.key.length === 1 ||
                e.key === "Enter" ||
                e.key === "Backspace" ||
                e.key === "Delete"
              ) {
                e.preventDefault();
              }
            }}
            onClick={onArticleClick}
          />
        </div>
      ) : (
        <div
          ref={bindContentRoot}
          className="prose-content personal-content select-text relative z-[2] bg-transparent"
          onClick={onArticleClick}
          dangerouslySetInnerHTML={{ __html: fragment }}
        />
      )}
      {highlightMode ? (
        <div
          className="absolute inset-0 z-[3] touch-none"
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
