"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { UserContentHighlight } from "@/types";
import {
  createHighlight,
  deleteHighlight,
  updateHighlight,
} from "@/lib/offline/highlights";
import { applyHighlightsToHtml } from "@/lib/applyHighlights";
import { formatImportedHtml } from "@/lib/htmlFragment";
import { captureViewportRect } from "@/lib/captureTab";
import { HighlightToolbar } from "../HighlightToolbar";
import { HighlightNoteModal } from "../HighlightNoteModal";
import { blankCanvasScrollTarget } from "@/lib/blankCanvas";
import { LiveEditorRouter } from "./LiveEditorRouter";

interface PersonalContentAreaProps {
  content: string;
  userTopicId: string;
  highlights: UserContentHighlight[];
  onHighlightsChange: (highlights: UserContentHighlight[]) => void;
  onAskSelection?: (
    text: string,
    imageBase64?: string,
    attachNote?: (note: string) => Promise<void>
  ) => void;
  editing?: boolean;
  onContentChange?: (html: string) => void;
  clipMode?: boolean;
  onClip?: (imageDataUrl: string) => void;
  onReadProgress?: (percent: number) => void;
  onScrollContainer?: (el: HTMLElement | null) => void;
  onContentRoot?: (el: HTMLElement | null) => void;
  initialScrollTop?: number;
  initialScrollLeft?: number;
  onViewStateChange?: (state: { scrollTop: number; scrollLeft?: number }) => void;
  readOnly?: boolean;
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
}

export function PersonalContentArea({
  content,
  userTopicId,
  highlights,
  onHighlightsChange,
  onAskSelection,
  editing = false,
  onContentChange,
  clipMode = false,
  onClip,
  onReadProgress,
  onScrollContainer,
  onContentRoot,
  initialScrollTop,
  initialScrollLeft,
  onViewStateChange,
  readOnly = false,
  guestLocked = false,
  onGuestLockedClick,
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
  const clipDrag = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null
  );
  const [clipBox, setClipBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
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
  const rendered = useMemo(
    () => applyHighlightsToHtml(fragment, highlights),
    [fragment, highlights]
  );

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
    if (!clipMode || !onClip) return;
    const onPaste = async (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => onClip(String(reader.result));
      reader.readAsDataURL(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [clipMode, onClip]);

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
    if (editing || readOnly || clipMode) return;
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.isCollapsed || !container?.contains(sel.anchorNode)) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 3) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const next = {
      text,
      rect,
      startOffset,
      endOffset: startOffset + text.length,
    };
    selectionRef.current = next;
    setSelection(next);
  }, [editing, readOnly, clipMode]);

  const handleClick = (e: React.MouseEvent) => {
    if (editing) return;
    const mark = (e.target as HTMLElement).closest("mark[data-highlight-id]");
    if (!mark) return;
    const id = mark.getAttribute("data-highlight-id");
    const highlight = highlights.find((h) => h.id === id);
    if (!highlight) return;
    setSelection(null);
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

  const removeHighlightNow = (id: string) => {
    commitHighlights(highlightsRef.current.filter((h) => h.id !== id));
    setActiveHighlight(null);
    if (id.startsWith("tmp-")) {
      droppedHighlightIds.current.add(id);
      return;
    }
    void deleteHighlight(id, userTopicId).catch(() => undefined);
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
              : " px-8 py-6 max-w-3xl mx-auto"
        }${clipMode ? " cursor-crosshair" : ""}`}
        onMouseUp={clipMode ? undefined : handleMouseUp}
        onClick={clipMode ? undefined : handleClick}
        onPointerDown={
          clipMode
            ? (e) => {
                const el = e.currentTarget as HTMLElement;
                const r = el.getBoundingClientRect();
                const x = e.clientX - r.left + el.scrollLeft;
                const y = e.clientY - r.top + el.scrollTop;
                clipDrag.current = { x0: x, y0: y, x1: x, y1: y };
                setClipBox({ x, y, w: 0, h: 0 });
                el.setPointerCapture(e.pointerId);
              }
            : undefined
        }
        onPointerMove={
          clipMode
            ? (e) => {
                if (!clipDrag.current) return;
                const el = e.currentTarget as HTMLElement;
                const r = el.getBoundingClientRect();
                clipDrag.current.x1 = e.clientX - r.left + el.scrollLeft;
                clipDrag.current.y1 = e.clientY - r.top + el.scrollTop;
                const { x0, y0, x1, y1 } = clipDrag.current;
                setClipBox({
                  x: Math.min(x0, x1),
                  y: Math.min(y0, y1),
                  w: Math.abs(x1 - x0),
                  h: Math.abs(y1 - y0),
                });
              }
            : undefined
        }
        onPointerUp={
          clipMode
            ? async (e) => {
                const drag = clipDrag.current;
                clipDrag.current = null;
                setClipBox(null);
                const el = e.currentTarget as HTMLElement;
                try {
                  el.releasePointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
                if (!drag || !onClip) return;
                const w = Math.abs(drag.x1 - drag.x0);
                const h = Math.abs(drag.y1 - drag.y0);
                if (w < 12 || h < 12) return;
                const r = el.getBoundingClientRect();
                const left = r.left + Math.min(drag.x0, drag.x1) - el.scrollLeft;
                const top = r.top + Math.min(drag.y0, drag.y1) - el.scrollTop;
                await new Promise<void>((resolve) =>
                  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
                );
                try {
                  const data = await captureViewportRect({
                    left,
                    top,
                    width: w,
                    height: h,
                  });
                  if (data) onClip(data);
                } catch {
                  /* capture cancelled or unsupported */
                }
              }
            : undefined
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
      {selection && (
        <HighlightToolbar
          rect={selection.rect}
          locked={guestLocked}
          onLockedClick={onGuestLockedClick}
          onHighlight={(color) => void saveHighlight(color)}
          onNote={() => {
            setNoteTarget({
              quote: selection.text,
              startOffset: selection.startOffset,
              endOffset: selection.endOffset,
            });
            setSelection(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  const draft = { ...selection };
                  selectionRef.current = draft;
                  onAskSelection(draft.text, undefined, async (note) => {
                    await saveHighlight("yellow", note);
                  });
                  setSelection(null);
                }
              : undefined
          }
          onClose={() => setSelection(null)}
        />
      )}
      {activeHighlight && (
        <HighlightToolbar
          rect={activeHighlight.rect}
          showColors
          locked={guestLocked}
          onLockedClick={onGuestLockedClick}
          onHighlight={() => {
            removeHighlightNow(activeHighlight.highlight.id);
          }}
          onNote={() => {
            setNoteTarget({
              quote: activeHighlight.highlight.text,
              highlight: activeHighlight.highlight,
            });
            setActiveHighlight(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  onAskSelection(activeHighlight.highlight.text);
                  setActiveHighlight(null);
                }
              : undefined
          }
          onRemove={() => {
            removeHighlightNow(activeHighlight.highlight.id);
          }}
          onClose={() => setActiveHighlight(null)}
        />
      )}
      {noteTarget && (
        <HighlightNoteModal
          quote={noteTarget.quote}
          initialNote={noteTarget.highlight?.note ?? ""}
          onClose={() => setNoteTarget(null)}
          onSave={async (note) => {
            if (noteTarget.highlight) {
              const highlight = await updateHighlight(
                noteTarget.highlight.id,
                { note },
                userTopicId,
              );
              onHighlightsChange(
                highlights.map((h) =>
                  h.id === highlight.id ? { ...h, ...highlight } : h
                )
              );
              return;
            }
            if (
              noteTarget.startOffset == null ||
              noteTarget.endOffset == null
            ) {
              return;
            }
            const highlight = await createHighlight({
              userTopicId,
              text: noteTarget.quote,
              startOffset: noteTarget.startOffset,
              endOffset: noteTarget.endOffset,
              color: "yellow",
              note,
            });
            onHighlightsChange([...highlights, highlight]);
          }}
          onDeleteNote={
            noteTarget.highlight?.note
              ? async () => {
                  const highlight = await updateHighlight(
                    noteTarget.highlight!.id,
                    { note: null },
                    userTopicId,
                  );
                  onHighlightsChange(
                    highlights.map((h) =>
                      h.id === highlight.id ? { ...h, note: null } : h
                    )
                  );
                }
              : undefined
          }
          onRemoveHighlight={
            noteTarget.highlight
              ? () => {
                  removeHighlightNow(noteTarget.highlight!.id);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
