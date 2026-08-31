"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Highlighter, StickyNote } from "lucide-react";
import clsx from "clsx";
import type { UserContentHighlight } from "@/types";
import { highlightHex } from "@/components/my-content/pdfViewerHelpers";
import {
  highlightSnippetText,
  sortHighlightsForPanel,
} from "@/lib/highlightNavigation";

const PAGE_SIZE = 12;

type HighlightsPanelProps = {
  highlights: UserContentHighlight[];
  hydrating: boolean;
  isPdf: boolean;
  onSelect: (highlight: UserContentHighlight) => void;
};

export function HighlightsPanel({
  highlights,
  hydrating,
  isPdf,
  onSelect,
}: HighlightsPanelProps) {
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () => sortHighlightsForPanel(highlights),
    [highlights]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  useEffect(() => {
    setPage(0);
  }, [sorted.length]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const slice = sorted.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const showSkeleton = hydrating && sorted.length === 0;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 space-y-2">
        {showSkeleton ? (
          <div className="space-y-2 pt-1" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-[10px] bg-[var(--bg-secondary)] animate-pulse"
              />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center px-3 py-10">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-[var(--text-muted)] mb-3">
              <Highlighter className="w-5 h-5" />
            </span>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No highlights yet
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[220px]">
              Select text or use the highlighter on this page — they will appear
              here as snippets you can jump back to.
            </p>
          </div>
        ) : (
          slice.map((h) => {
            const snippet = highlightSnippetText(h);
            const note = h.note?.trim();
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => onSelect(h)}
                className={clsx(
                  "w-full text-left rounded-[10px] border border-[var(--border-subtle)]",
                  "bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)]",
                  "px-3 py-2.5 transition-colors group"
                )}
              >
                <div className="flex gap-2.5 min-w-0">
                  <span
                    className="w-1 shrink-0 rounded-full self-stretch min-h-[2.5rem]"
                    style={{ backgroundColor: highlightHex(h.color) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2 min-w-0">
                      <p className="text-[13px] leading-snug text-[var(--text-primary)] line-clamp-3 flex-1 min-w-0">
                        {snippet}
                      </p>
                      {isPdf && h.pageNumber != null ? (
                        <span className="shrink-0 text-[10px] font-medium tabular-nums px-1.5 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                          p.{h.pageNumber}
                        </span>
                      ) : null}
                    </div>
                    {note ? (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-[var(--text-secondary)] line-clamp-2">
                        <StickyNote className="w-3 h-3 shrink-0 mt-0.5 text-[var(--text-muted)]" />
                        <span>{note}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {sorted.length > PAGE_SIZE ? (
        <div className="shrink-0 flex items-center justify-between gap-2 pt-3 mt-1 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
            {safePage + 1} / {totalPages}
            <span className="mx-1">·</span>
            {sorted.length} total
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : sorted.length > 0 ? (
        <p className="shrink-0 pt-3 mt-1 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
          {sorted.length} highlight{sorted.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}
