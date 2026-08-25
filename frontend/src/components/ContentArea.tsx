"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Highlight } from "@/types";
import { api } from "@/lib/api";
import { applyHighlightsToHtml } from "@/lib/applyHighlights";
import { HighlightToolbar } from "./HighlightToolbar";
import { HighlightNoteModal } from "./HighlightNoteModal";
import { FullscreenButton } from "./FullscreenButton";
import { useFullscreen } from "@/hooks/useFullscreen";

interface ContentAreaProps {
  content: string;
  articleId: string;
  highlights: Highlight[];
  onHighlightsChange: (highlights: Highlight[]) => void;
  onReadProgress: (percent: number) => void;
  readOnly?: boolean;
  onAskSelection?: (
    text: string,
    attachNote?: (note: string) => Promise<void>
  ) => void;
}

export function ContentArea({
  content,
  articleId,
  highlights,
  onHighlightsChange,
  onReadProgress,
  readOnly = false,
  onAskSelection,
}: ContentAreaProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);
  const [selection, setSelection] = useState<{
    text: string;
    rect: DOMRect;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [noteTarget, setNoteTarget] = useState<{
    quote: string;
    highlight?: Highlight;
    startOffset?: number;
    endOffset?: number;
  } | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<{
    highlight: Highlight;
    rect: DOMRect;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const percent = Math.min(
        100,
        Math.round((scrollTop / (scrollHeight - clientHeight)) * 100) || 0
      );
      onReadProgress(percent);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onReadProgress]);

  const handleMouseUp = useCallback(() => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 3) {
      setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    const preRange = document.createRange();
    preRange.selectNodeContents(containerRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + text.length;

    setSelection({ text, rect, startOffset, endOffset });
  }, [readOnly]);

  const saveHighlight = async (color: string, note?: string) => {
    if (!selection) return;
    const { highlight } = await api.highlights.create({
      articleId,
      text: selection.text,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
      color,
      note,
    });
    onHighlightsChange([...highlights, highlight]);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const renderedContent = useMemo(
    () => applyHighlightsToHtml(content, highlights),
    [content, highlights]
  );

  return (
    <div
      ref={rootRef}
      className="relative flex-1 overflow-hidden bg-[var(--bg-primary)] [:fullscreen]:bg-[var(--bg-primary)]"
    >
      <div className="absolute top-2 right-3 z-10">
        <FullscreenButton
          isFullscreen={isFullscreen}
          onToggle={() => void toggleFullscreen()}
        />
      </div>
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-8 py-6 max-w-3xl mx-auto"
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (readOnly) return;
          const mark = (e.target as HTMLElement).closest(
            "mark[data-highlight-id]"
          );
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
        }}
      >
        <div
          className="prose-content"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>

      {selection && (
        <HighlightToolbar
          rect={selection.rect}
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
                  const draft = selection;
                  onAskSelection(draft.text, async (note) => {
                    const { highlight } = await api.highlights.create({
                      articleId,
                      text: draft.text,
                      startOffset: draft.startOffset,
                      endOffset: draft.endOffset,
                      color: "yellow",
                      note,
                    });
                    onHighlightsChange([...highlights, highlight]);
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
          onHighlight={async () => {
            await api.highlights.delete(activeHighlight.highlight.id);
            onHighlightsChange(
              highlights.filter((h) => h.id !== activeHighlight.highlight.id)
            );
            setActiveHighlight(null);
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
          onRemove={async () => {
            await api.highlights.delete(activeHighlight.highlight.id);
            onHighlightsChange(
              highlights.filter((h) => h.id !== activeHighlight.highlight.id)
            );
            setActiveHighlight(null);
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
              const { highlight } = await api.highlights.update(
                noteTarget.highlight.id,
                { note }
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
            const { highlight } = await api.highlights.create({
              articleId,
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
                  const { highlight } = await api.highlights.update(
                    noteTarget.highlight!.id,
                    { note: null }
                  );
                  onHighlightsChange(
                    highlights.map((h) =>
                      h.id === highlight.id ? { ...h, note: undefined } : h
                    )
                  );
                }
              : undefined
          }
          onRemoveHighlight={
            noteTarget.highlight
              ? async () => {
                  await api.highlights.delete(noteTarget.highlight!.id);
                  onHighlightsChange(
                    highlights.filter((h) => h.id !== noteTarget.highlight!.id)
                  );
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
