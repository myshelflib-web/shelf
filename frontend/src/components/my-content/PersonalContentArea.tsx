"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { UserContentHighlight } from "@/types";
import { applyHighlightsToHtml } from "@/lib/applyHighlights";
import { formatImportedHtml } from "@/lib/htmlFragment";
import { blankCanvasScrollTarget } from "@/lib/blankCanvas";
import { LiveEditorRouter } from "./LiveEditorRouter";
import { usePersonalContentClip } from "./usePersonalContentClip";
import { PersonalContentHighlightChrome } from "./PersonalContentHighlightChrome";
import {
  createHighlight,
  deleteHighlight,
} from "@/lib/offline/highlights";
import type { PersonalContentAreaProps } from "./personalContentAreaTypes";

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
  const selectionRef = useRef<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [selection, setSelection] = useState<{
    text: string;
    rect: DOMRect;
    startOffset: number;
    endOffset: number;
  } | null>(null);
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
  const selectGenRef = useRef(0);
  const highlightModeRef = useRef(highlightMode);
  highlightModeRef.current = highlightMode;
  const preferredColorRef = useRef(preferredHighlightColorId);
  preferredColorRef.current = preferredHighlightColorId;
  const saveHighlightRef = useRef<(color: string, note?: string) => void>(
    () => undefined
  );

  const commitHighlights = (next: UserContentHighlight[]) => {
    highlightsRef.current = next;
    onHighlightsChange(next);
  };

  const fragment = useMemo(() => formatImportedHtml(content), [content]);
  const rendered = useMemo(
    () => applyHighlightsToHtml(fragment, highlights),
    [fragment, highlights]
  );

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
  }, [editing, rendered]);

  useEffect(() => {
    onScrollContainer?.(containerRef.current);
    onContentRoot?.(
      (containerRef.current?.querySelector(".personal-content") as HTMLElement) ??
        rootRef.current
    );
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

  const handleMouseUp = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode) return;
    const gen = ++selectGenRef.current;
    // Selection is often finalized after pointerup handlers return (Safari /
    // trackpad). Read it on the next frame so the highlight menu can open.
    window.requestAnimationFrame(() => {
      if (gen !== selectGenRef.current) return;
      if (editing || readOnly || clipMode || eraseMode) return;
      const sel = window.getSelection();
      const container = containerRef.current;
      const contentRoot =
        (container?.querySelector(".personal-content") as HTMLElement | null) ??
        container;
      if (!sel || sel.isCollapsed || !contentRoot) {
        // Do not clear an existing menu from a stale collapsed read — only
        // clear when this gesture produced no range.
        if (gen === selectGenRef.current) setSelection(null);
        return;
      }
      if (sel.rangeCount < 1) {
        if (gen === selectGenRef.current) setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!contentRoot.contains(range.commonAncestorContainer)) {
        if (gen === selectGenRef.current) setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      if (text.length < 3) {
        if (gen === selectGenRef.current) setSelection(null);
        return;
      }

      let rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        const clientRects = Array.from(range.getClientRects()).filter(
          (r) => r.width > 0 || r.height > 0
        );
        if (clientRects.length === 0) {
          if (gen === selectGenRef.current) setSelection(null);
          return;
        }
        rect = clientRects[0]!;
      }
      // Offsets must match applyHighlightsToHtml (plain text of the article
      // root), not the scroll container.
      const preRange = document.createRange();
      preRange.selectNodeContents(contentRoot);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const next = {
        text,
        rect,
        startOffset,
        endOffset: startOffset + text.length,
      };
      selectionRef.current = next;
      setActiveHighlight(null);
      if (highlightModeRef.current) {
        // Highlighter tool: apply preferred color immediately (PDF pen-like).
        setSelection(null);
        window.getSelection()?.removeAllRanges();
        saveHighlightRef.current?.(preferredColorRef.current);
        return;
      }
      setSelection(next);
    });
  }, [editing, readOnly, clipMode, eraseMode]);

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

  const handleClick = (e: React.MouseEvent) => {
    if (editing || clipMode) return;
    const mark = (e.target as HTMLElement).closest("mark[data-highlight-id]");
    if (!mark) return;
    const id = mark.getAttribute("data-highlight-id");
    const highlight = highlights.find((h) => h.id === id);
    if (!highlight) return;
    setSelection(null);
    if (eraseMode) {
      if (guestLocked) {
        onGuestLockedClick?.("Highlight and annotate");
        return;
      }
      removeHighlightNow(highlight.id);
      return;
    }
    const r = mark.getBoundingClientRect();
    setActiveHighlight({
      highlight,
      rect: new DOMRect(r.left, r.top, r.width, r.height),
    });
  };

  const saveHighlight = (color: string, note?: string) => {
    if (guestLocked) {
      onGuestLockedClick?.("Highlight and annotate");
      return;
    }
    const sel = selection ?? selectionRef.current;
    if (!sel) return;
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimistic: UserContentHighlight = {
      id: tempId,
      userTopicId,
      text: sel.text,
      startOffset: sel.startOffset,
      endOffset: sel.endOffset,
      color,
      note: note ?? null,
      kind: "TEXT",
    };
    commitHighlights([...highlightsRef.current, optimistic]);
    setSelection(null);
    setActiveHighlight(null);
    window.getSelection()?.removeAllRanges();
    void createHighlight({
      userTopicId,
      text: sel.text,
      startOffset: sel.startOffset,
      endOffset: sel.endOffset,
      color,
      note,
    })
      .then((highlight) => {
        if (droppedHighlightIds.current.has(tempId)) {
          droppedHighlightIds.current.delete(tempId);
          void deleteHighlight(highlight.id, userTopicId).catch(() => undefined);
          return;
        }
        commitHighlights(
          highlightsRef.current.map((h) => (h.id === tempId ? highlight : h))
        );
      })
      .catch(() => {
        commitHighlights(highlightsRef.current.filter((h) => h.id !== tempId));
      });
    return optimistic;
  };
  saveHighlightRef.current = saveHighlight;

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
        className={`h-full overflow-auto relative${
          fragment.includes("shelf-blank-canvas") ||
          fragment.includes("shelf-sketch-notebook")
            ? " blank-canvas-viewport"
            : fragment.includes("shelf-doc-editor")
              ? " doc-editor-viewport"
              : readingWidth === "wide"
                ? " px-6 py-6 max-w-none"
                : " px-8 py-6 max-w-3xl mx-auto"
        }${clipMode ? " cursor-crosshair" : eraseMode ? " cursor-pointer" : ""}`}
        style={
          contentScale !== 1
            ? { zoom: contentScale }
            : undefined
        }
        onMouseUp={clipMode ? undefined : handleMouseUp}
        onClick={clipMode ? undefined : handleClick}
        onPointerDown={clipMode ? onPointerDown : undefined}
        onPointerMove={clipMode ? onPointerMove : undefined}
        onPointerUp={
          clipMode
            ? onPointerUp
            : (e) => {
                if (e.pointerType === "mouse") return;
                handleMouseUp();
              }
        }
      >
        <div
          className="prose-content personal-content"
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
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
