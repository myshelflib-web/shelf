"use client";

import { useCallback, useEffect, useRef } from "react";
import { parseDocBody, serializeDocBody } from "@/lib/docEditor";
import {
  openOriginalityFromSelection,
  openParaphraseFromSelection,
} from "@/lib/openWritingAssistFromSelection";
import { useDocResearch } from "@/lib/useDocResearch";
import { DocToolbar, runDocCommand } from "./DocToolbar";
import { DocResearchToolbar } from "./doc-research/DocResearchToolbar";
import { DocSourcesPanel } from "./doc-research/DocSourcesPanel";
import { DocOutlinePanel } from "./doc-research/DocOutlinePanel";
import { DocHistoryPanel } from "./doc-research/DocHistoryPanel";
import { DocCommentsPanel } from "./doc-research/DocCommentsPanel";
import { DocLibraryFindPanel } from "./doc-research/DocLibraryFindPanel";

interface DocEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  onViewStateChange?: (state: { scrollTop: number; scrollLeft: number }) => void;
  compact?: boolean;
  pageId?: string;
  title?: string;
}

function selectedOrBodyText(body: HTMLElement | null): string {
  const sel = window.getSelection();
  if (
    sel &&
    !sel.isCollapsed &&
    body &&
    sel.anchorNode &&
    body.contains(sel.anchorNode)
  ) {
    const t = sel.toString().trim();
    if (t) return t;
  }
  return (body?.innerText ?? "").replace(/\s+/g, " ").trim();
}

export function DocEditor({
  initialHtml,
  onChange,
  onViewStateChange,
  compact = false,
  pageId,
  title,
}: DocEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const seeded = useRef(false);
  const scheduleRef = useRef<(html: string) => void>(() => undefined);
  const refreshStatsRef = useRef<() => void>(() => undefined);

  const emit = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const html = serializeDocBody(el.innerHTML);
    onChangeRef.current(html);
    scheduleRef.current(html);
    refreshStatsRef.current();
  }, []);

  const research = useDocResearch({
    pageId,
    bodyRef,
    emit,
    title,
  });
  scheduleRef.current = research.scheduleRevision;
  refreshStatsRef.current = research.refreshStats;

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const el = bodyRef.current;
    if (el) {
      el.innerHTML = parseDocBody(initialHtml);
      research.refreshStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select")) return;
      if (
        t &&
        t !== bodyRef.current &&
        !bodyRef.current?.contains(t) &&
        t.isContentEditable
      ) {
        return;
      }
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        bodyRef.current?.focus();
        runDocCommand(e.shiftKey ? "redo" : "undo");
        emit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emit]);

  const runCommand = (cmd: string, value?: string) => {
    bodyRef.current?.focus();
    runDocCommand(cmd, value);
    emit();
  };

  const insertRewrite = (text: string) => {
    bodyRef.current?.focus();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed && bodyRef.current?.contains(sel.anchorNode)) {
      document.execCommand("insertText", false, text);
    } else if (bodyRef.current) {
      document.execCommand("selectAll");
      document.execCommand("insertText", false, text);
    }
    emit();
  };

  const restoreHtml = (html: string) => {
    const el = bodyRef.current;
    if (!el) return;
    el.innerHTML = parseDocBody(html);
    emit();
  };

  const showResearch = Boolean(pageId) && !compact;

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)] min-h-0">
      <DocToolbar
        onCommand={runCommand}
        compact={compact}
        onParaphrase={() => {
          openParaphraseFromSelection(selectedOrBodyText(bodyRef.current), {
            pageId,
            onInsert: insertRewrite,
          });
        }}
        onOriginality={() => {
          openOriginalityFromSelection(selectedOrBodyText(bodyRef.current), {
            pageId,
          });
        }}
        researchSlot={
          showResearch ? (
            <DocResearchToolbar
              compact={compact}
              citeStyle={research.citeStyle}
              onCiteStyle={research.setCiteStyle}
              suggestMode={research.suggestMode}
              onToggleSuggest={() =>
                research.setSuggestMode(!research.suggestMode)
              }
              panel={research.panel}
              onPanel={research.setPanel}
              onFootnote={research.insertFootnote}
              onFigure={research.insertFigure}
              onTable={research.insertTable}
              onEquation={research.insertEquation}
              onGlossary={research.insertGlossary}
              onXref={research.insertXref}
              onExport={(fmt) => void research.onExport(fmt)}
              onResearchAi={research.onResearchAi}
            />
          ) : null
        }
      />
      {research.suggestMode && showResearch && (
        <div className="flex items-center gap-2 px-3 py-1 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[11px]">
          <span className="text-[var(--text-muted)]">Suggest mode</span>
          <button
            type="button"
            className="text-[var(--accent)]"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => research.applySuggestToSelection("ins")}
          >
            Mark insert
          </button>
          <button
            type="button"
            className="text-red-500"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => research.applySuggestToSelection("del")}
          >
            Mark delete
          </button>
          <button
            type="button"
            className="text-emerald-600"
            onMouseDown={(e) => e.preventDefault()}
            onClick={research.acceptSuggest}
          >
            Accept all
          </button>
          <button
            type="button"
            className="text-[var(--text-muted)]"
            onMouseDown={(e) => e.preventDefault()}
            onClick={research.rejectSuggest}
          >
            Reject all
          </button>
        </div>
      )}
      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        <div
          ref={viewportRef}
          className="flex-1 overflow-auto doc-editor-viewport min-h-0"
          onScroll={() => {
            const vp = viewportRef.current;
            if (!vp) return;
            onViewStateChange?.({
              scrollTop: vp.scrollTop,
              scrollLeft: vp.scrollLeft,
            });
          }}
        >
          {compact ? (
            <div className="min-h-full h-full">
              <div className="shelf-doc-editor min-h-full h-full bg-[var(--bg-primary)]">
                <div
                  ref={bodyRef}
                  className="shelf-doc-body prose-content px-3.5 py-3 outline-none min-h-full text-[var(--text-primary)]"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={emit}
                  onBlur={emit}
                />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-8 min-h-full">
              <div className="shelf-doc-editor rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm min-h-[70vh]">
                <div
                  ref={bodyRef}
                  className="shelf-doc-body prose-content px-10 py-12 outline-none min-h-[70vh] text-[var(--text-primary)]"
                  contentEditable
                  suppressContentEditableWarning
                  onInput={emit}
                  onBlur={emit}
                />
              </div>
            </div>
          )}
        </div>
        {pageId ? (
          <>
            <DocSourcesPanel
              pageId={pageId}
              open={research.panel === "sources"}
              onClose={() => research.setPanel(null)}
              onInserted={emit}
              citeStyle={research.citeStyle}
            />
            <DocOutlinePanel
              bodyRef={bodyRef}
              open={research.panel === "outline"}
              onClose={() => research.setPanel(null)}
            />
            <DocHistoryPanel
              pageId={pageId}
              open={research.panel === "history"}
              onClose={() => research.setPanel(null)}
              currentHtml={serializeDocBody(bodyRef.current?.innerHTML || "")}
              onRestore={restoreHtml}
            />
            <DocCommentsPanel
              pageId={pageId}
              open={research.panel === "comments"}
              onClose={() => research.setPanel(null)}
              selectionQuote={research.selectionQuote}
            />
            <DocLibraryFindPanel
              open={research.panel === "find"}
              onClose={() => research.setPanel(null)}
              onInserted={emit}
            />
          </>
        ) : null}
      </div>
      {compact ? null : (
        <div className="doc-editor-hint shrink-0 flex items-center justify-center gap-3 text-[11px] text-[var(--text-muted)] py-1.5 border-t border-[var(--border)]">
          <span>
            {research.stats.words} words · {research.stats.chars} chars
            {research.stats.readingMinutes > 0
              ? ` · ~${research.stats.readingMinutes} min read`
              : ""}
          </span>
          <span aria-hidden>·</span>
          <span>Doc — changes autosave</span>
          {pageId ? (
            <button
              type="button"
              className="text-[var(--accent)]"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                research.captureSelectionQuote();
                research.setPanel("comments");
              }}
            >
              Comment
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
