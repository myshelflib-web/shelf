"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { UserContentHighlight } from "@/types";
import { DEFAULT_PEN_WIDTH } from "@/lib/straightenStroke";
import { formatImportedHtml } from "@/lib/htmlFragment";
import { blankCanvasScrollTarget } from "@/lib/blankCanvas";
import { LiveEditorRouter } from "./LiveEditorRouter";
import { usePersonalContentClip } from "./usePersonalContentClip";
import { PersonalContentHighlightChrome } from "./PersonalContentHighlightChrome";
import { hasHtmlStrokes, HtmlHighlightLayer } from "./HtmlHighlightLayer";
import { deleteHighlight } from "@/lib/offline/highlights";
import type { PersonalContentAreaProps } from "./personalContentAreaTypes";
import { usePersonalContentSelection } from "./usePersonalContentSelection";
import { useHtmlHighlightStroke } from "./useHtmlHighlightStroke";
import { useHtmlTextHighlightPaint } from "./useHtmlTextHighlightPaint";
import { textHighlightFromEvent } from "./htmlHighlightGeometry";
import type { HtmlTextPick } from "./htmlPageSelection";
import {
  persistHtmlHighlight,
  strokeHighlightDraft,
  textHighlightDraft,
} from "./persistHtmlHighlight";

export function PersonalContentArea({
  content,
  userTopicId,
  highlights,
  onHighlightsChange,
  onAskSelection,
  editing = false,
  onContentChange,
  clipMode = false,
  eraseMode = false,
  highlightMode = false,
  preferredHighlightColorId = "yellow",
  highlightWidth = DEFAULT_PEN_WIDTH,
  highlightOpacity = 0.72,
  readingWidth = "comfortable",
  contentScale = 1,
  annotationGate = null,
  onClip,
  onReadProgress,
  onScrollContainer,
  onContentRoot,
  initialScrollTop,
  initialScrollLeft,
  initialScale,
  zoomCommandsRef,
  onViewStateChange,
  readOnly = false,
  guestLocked = false,
  onGuestLockedClick,
  compactEditor = false,
}: PersonalContentAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const restoredScrollRef = useRef(false);
  const onViewStateChangeRef = useRef(onViewStateChange);
  onViewStateChangeRef.current = onViewStateChange;
  const [scrollRestored, setScrollRestored] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HtmlTextPick | null>(null);
  const [selection, setSelection] = useState<HtmlTextPick | null>(null);
  const [noteTarget, setNoteTarget] = useState<{
    quote: string;
    highlight?: UserContentHighlight;
    startOffset?: number;
    endOffset?: number;
  } | null>(null);
  const { clipBox, onPointerDown, onPointerMove, onPointerUp } =
    usePersonalContentClip(clipMode, onClip);
  const [activeHighlight, setActiveHighlight] = useState<{
    highlight: UserContentHighlight;
    rect: DOMRect;
  } | null>(null);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const droppedHighlightIds = useRef(new Set<string>());

  const commitHighlights = (next: UserContentHighlight[]) => {
    highlightsRef.current = next;
    onHighlightsChange(next);
  };

  const fragment = useMemo(() => formatImportedHtml(content), [content]);
  const contentRootRef = useRef<HTMLDivElement>(null);
  const originRef = useRef<HTMLDivElement>(null);
  const [contentEl, setContentEl] = useState<HTMLElement | null>(null);
  const setContentRoot = useCallback((el: HTMLDivElement | null) => {
    contentRootRef.current = el;
    setContentEl(el);
  }, []);
  const setOrigin = useCallback((el: HTMLDivElement | null) => {
    originRef.current = el;
  }, []);
  useHtmlTextHighlightPaint(editing ? null : contentEl, highlights);
  useEffect(() => {
    if (editing || !fragment.includes("preloaded-official-fallback")) return;
    const root = containerRef.current;
    if (!root) return;
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest(
        "a.preloaded-official-fallback__cta"
      ) as HTMLAnchorElement | null;
      if (!anchor?.href) return;
      event.preventDefault();
      window.open(anchor.href, "_blank", "noopener,noreferrer");
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [editing, fragment]);

  useEffect(() => {
    if (editing) return;
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>(".shelf-blank-canvas, .shelf-sketch-page").forEach((el) => {
      const w = el.getAttribute("data-w");
      const h = el.getAttribute("data-h");
      if (w) el.style.width = `${w}px`;
      if (h) el.style.height = `${h}px`;
    });
  }, [editing, fragment]);

  useEffect(() => {
    onScrollContainer?.(containerRef.current);
    onContentRoot?.(contentRootRef.current ?? rootRef.current);
    return () => {
      onScrollContainer?.(null);
      onContentRoot?.(null);
    };
  }, [onScrollContainer, onContentRoot, editing, content]);

  useEffect(() => {
    if (editing) {
      restoredScrollRef.current = false;
      setScrollRestored(false);
      return;
    }
    const container = containerRef.current;
    if (!container || restoredScrollRef.current) return;

    const savedTop =
      typeof initialScrollTop === "number" && initialScrollTop > 0
        ? initialScrollTop
        : 0;
    const savedLeft =
      typeof initialScrollLeft === "number" && initialScrollLeft > 0
        ? initialScrollLeft
        : 0;
    const pan =
      fragment.includes("shelf-blank-canvas") ||
      fragment.includes("shelf-sketch-notebook")
        ? blankCanvasScrollTarget(
          fragment,
          container.clientWidth || 800,
          container.clientHeight || 600
        )
      : null;
    const useSaved = savedTop > 40 || savedLeft > 40;
    const targetTop = useSaved ? savedTop : pan?.top ?? savedTop;
    const targetLeft = useSaved ? savedLeft : pan?.left ?? savedLeft;

    if (targetTop <= 0 && targetLeft <= 0 && !pan) {
      restoredScrollRef.current = true;
      setScrollRestored(true);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const apply = () => {
      if (cancelled) return;
      attempts += 1;
      if (
        container.scrollHeight > targetTop ||
        container.scrollWidth > targetLeft ||
        attempts >= 40
      ) {
        container.scrollTop = targetTop;
        container.scrollLeft = targetLeft;
        restoredScrollRef.current = true;
        setScrollRestored(true);
        return;
      }
      requestAnimationFrame(apply);
    };
    const id = requestAnimationFrame(apply);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [initialScrollTop, initialScrollLeft, editing, content, fragment]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || editing || !scrollRestored) return;

    const emit = () => {
      onViewStateChangeRef.current?.({
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      });
    };
    const handleScroll = () => {
      if (onReadProgress) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const percent = Math.min(
          100,
          Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0
        );
        onReadProgress(percent);
      }
      emit();
    };
    const onHide = () => emit();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") emit();
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    handleScroll();
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      emit();
    };
  }, [onReadProgress, editing, content, scrollRestored]);

  const removeHighlightNow = (id: string) => {
    commitHighlights(highlightsRef.current.filter((h) => h.id !== id));
    setActiveHighlight(null);
    setSelection(null);
    if (id.startsWith("tmp-")) {
      droppedHighlightIds.current.add(id);
      return;
    }
    void deleteHighlight(id, userTopicId).catch(() => undefined);
  };

  const saveHighlight = (color: string, note?: string) => {
    if (guestLocked) {
      onGuestLockedClick?.("Highlight and annotate");
      return;
    }
    const sel = selectionRef.current ?? selection;
    if (!sel) return;
    const optimistic = textHighlightDraft(userTopicId, sel, color, note);
    persistHtmlHighlight({
      optimistic,
      payload: {
        userTopicId,
        text: sel.text,
        startOffset: sel.startOffset,
        endOffset: sel.endOffset,
        color,
        note,
        kind: "TEXT",
        position: optimistic.position,
      },
      commit: commitHighlights,
      current: () => highlightsRef.current,
      dropped: droppedHighlightIds.current,
    });
    selectionRef.current = null;
    setSelection(null);
    setActiveHighlight(null);
    window.getSelection()?.removeAllRanges();
    return optimistic;
  };

  const saveStroke = (points: Array<{ x: number; y: number }>) => {
    if (guestLocked) {
      onGuestLockedClick?.("Highlight and annotate");
      return;
    }
    if (points.length < 2) return;
    const optimistic = strokeHighlightDraft(
      userTopicId,
      preferredHighlightColorId,
      points,
      highlightWidth,
      highlightOpacity
    );
    persistHtmlHighlight({
      optimistic,
      payload: {
        userTopicId,
        text: optimistic.text,
        startOffset: 0,
        endOffset: 0,
        color: preferredHighlightColorId,
        kind: "REGION",
        position: optimistic.position,
      },
      commit: commitHighlights,
      current: () => highlightsRef.current,
      dropped: droppedHighlightIds.current,
    });
  };

  const { draft, onPointerDown: onStrokeDown, onPointerMove: onStrokeMove, onPointerUp: onStrokeUp } =
    useHtmlHighlightStroke(originRef, highlightMode && !clipMode && !editing, saveStroke);

  const onTextPick = (pick: HtmlTextPick) => {
    selectionRef.current = pick;
    setActiveHighlight(null);
    setSelection(pick);
  };

  const { handleMouseUp } = usePersonalContentSelection({
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode,
    contentRootRef,
    originRef,
    onTextPick,
  });

  const onMarkActivate = (
    highlight: UserContentHighlight,
    clientX: number,
    clientY: number
  ) => {
    setSelection(null);
    if (eraseMode) {
      if (guestLocked) {
        onGuestLockedClick?.("Highlight and annotate");
        return;
      }
      removeHighlightNow(highlight.id);
      return;
    }
    setActiveHighlight({
      highlight,
      rect: new DOMRect(clientX, clientY, 1, 1),
    });
  };

  if (editing) {
    return (
      <div
        ref={rootRef}
        className="relative flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)] [:fullscreen]:bg-[var(--bg-primary)]"
      >
        <LiveEditorRouter
          content={content}
          userTopicId={userTopicId}
          onContentChange={onContentChange}
          onViewStateChange={onViewStateChange}
          compact={compactEditor}
          initialScale={initialScale}
          initialScrollTop={initialScrollTop}
          initialScrollLeft={initialScrollLeft}
          zoomCommandsRef={zoomCommandsRef}
        />
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="relative flex-1 overflow-hidden bg-[var(--bg-primary)] [:fullscreen]:bg-[var(--bg-primary)]"
    >
      {clipMode && (
        <p
          data-clip-chrome="1"
          className="absolute top-2 left-1/2 -translate-x-1/2 z-10 text-[11px] px-2 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]"
        >
          Drag to clip a region, or paste a screenshot
        </p>
      )}
      <div
        ref={containerRef}
        data-shelf-hotkeys={clipMode ? "off" : undefined}
        className={`h-full overflow-auto relative select-text${
          fragment.includes("shelf-blank-canvas") ||
          fragment.includes("shelf-sketch-notebook")
            ? " blank-canvas-viewport"
            : fragment.includes("shelf-doc-editor")
              ? " doc-editor-viewport"
              : readingWidth === "wide"
                ? " px-6 py-6 max-w-none"
                : " px-8 py-6 max-w-3xl mx-auto"
        }${
          clipMode || highlightMode
            ? " cursor-crosshair"
            : eraseMode
              ? " cursor-pointer"
              : " cursor-text"
        }`}
        onMouseUp={
          clipMode || highlightMode || eraseMode ? undefined : handleMouseUp
        }
        onPointerDown={clipMode ? onPointerDown : undefined}
        onPointerMove={clipMode ? onPointerMove : undefined}
        onPointerUp={clipMode ? onPointerUp : undefined}
      >
        <div
          ref={setOrigin}
          className={`relative${highlightMode ? " html-article-pen-mode" : ""}`}
          style={
            contentScale !== 1
              ? { fontSize: `${Math.round(contentScale * 100)}%` }
              : undefined
          }
          onPointerDown={highlightMode ? onStrokeDown : undefined}
          onPointerMove={highlightMode ? onStrokeMove : undefined}
          onPointerUp={highlightMode ? onStrokeUp : undefined}
        >
          {hasHtmlStrokes(highlights) || draft.length > 1 || highlightMode ? (
            <HtmlHighlightLayer
              originRef={originRef}
              highlights={highlights}
              eraseMode={eraseMode}
              draftPoints={draft}
              draftColor={preferredHighlightColorId}
              draftWidth={highlightWidth}
              draftOpacity={highlightOpacity}
              onActivate={onMarkActivate}
            />
          ) : null}
          <div
            ref={setContentRoot}
            className="prose-content personal-content select-text relative z-[1] bg-transparent"
            onClick={(e) => {
              if (clipMode || highlightMode || editing) return;
              const root = contentRootRef.current;
              if (!root) return;
              const hit = textHighlightFromEvent(e, root, highlights);
              if (hit) onMarkActivate(hit, e.clientX, e.clientY);
            }}
            dangerouslySetInnerHTML={{ __html: fragment }}
          />
        </div>
        {clipBox && (
          <div
            className="clip-select-rect absolute border-2 border-[var(--accent)] bg-[var(--accent)]/10 pointer-events-none z-[3]"
            style={{
              left: clipBox.x,
              top: clipBox.y,
              width: clipBox.w,
              height: clipBox.h,
            }}
          />
        )}
      </div>
      <PersonalContentHighlightChrome
        userTopicId={userTopicId}
        highlights={highlights}
        onHighlightsChange={onHighlightsChange}
        selection={selection}
        setSelection={setSelection}
        selectionRef={selectionRef}
        activeHighlight={activeHighlight}
        setActiveHighlight={setActiveHighlight}
        noteTarget={noteTarget}
        setNoteTarget={setNoteTarget}
        saveHighlight={saveHighlight}
        removeHighlightNow={removeHighlightNow}
        guestLocked={guestLocked}
        annotationGate={annotationGate}
        onGuestLockedClick={onGuestLockedClick}
        onAskSelection={onAskSelection}
        preferredHighlightColorId={preferredHighlightColorId}
      />
    </div>
  );
}
