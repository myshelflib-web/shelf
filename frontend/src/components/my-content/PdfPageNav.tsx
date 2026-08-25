"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";
import { PdfPagePreviewModal } from "./PdfPagePreviewModal";

export function PdfPageNav({
  currentPage,
  numPages,
  modeHint = "",
  pdfDoc,
  compact = false,
  canDeletePages = false,
  deletingPages = false,
  onGoToPage,
  onDeletePages,
}: {
  currentPage: number;
  numPages: number;
  modeHint?: string;
  pdfDoc: PDFDocumentProxy | null;
  compact?: boolean;
  canDeletePages?: boolean;
  deletingPages?: boolean;
  onGoToPage: (page: number) => void;
  onDeletePages?: (pages: number[]) => void | Promise<void>;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  /** Keep the field in sync with scroll page — never while the user is typing. */
  useEffect(() => {
    if (focusedRef.current) return;
    const el = inputRef.current;
    if (el) el.value = String(currentPage);
  }, [currentPage]);

  const commit = (raw: string) => {
    if (!numPages) return;
    const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
    if (!Number.isFinite(n)) {
      if (inputRef.current) inputRef.current.value = String(currentPage);
      return;
    }
    const next = Math.min(Math.max(1, n), numPages);
    if (inputRef.current) inputRef.current.value = String(next);
    if (next !== currentPage) onGoToPage(next);
  };

  return (
    <div className={compact ? "shrink-0" : "min-w-0"}>
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            disabled={!numPages || currentPage <= 1}
            onClick={() => onGoToPage(currentPage - 1)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-35 disabled:pointer-events-none shrink-0"
            title={withShortcut(
              numPages ? `Previous page (${currentPage - 1} of ${numPages})` : "Previous page",
              "left"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <form
            className="flex items-center gap-1 min-w-0"
            onSubmit={(e) => {
              e.preventDefault();
              focusedRef.current = false;
              commit(inputRef.current?.value ?? "");
              inputRef.current?.blur();
            }}
          >
            <label className="sr-only" htmlFor={inputId}>
              Go to page
            </label>
            <span className="text-sm text-[var(--text-muted)] shrink-0">Page</span>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              defaultValue={String(currentPage)}
              disabled={!numPages}
              onFocus={(e) => {
                focusedRef.current = true;
                e.currentTarget.select();
              }}
              onBlur={(e) => {
                focusedRef.current = false;
                commit(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                // Stop reader shortcuts (j/k/s/…) from eating keystrokes.
                e.stopPropagation();
                if (e.key === "Escape") {
                  focusedRef.current = false;
                  e.currentTarget.value = String(currentPage);
                  e.currentTarget.blur();
                }
              }}
              className="w-12 sm:w-14 px-1.5 py-0.5 text-sm font-medium tabular-nums tracking-tight text-center rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              aria-label="Go to page number"
              title="Go to page"
            />
            <span className="text-sm text-[var(--text-muted)] tabular-nums shrink-0">
              / {numPages || "—"}
            </span>
          </form>
          <button
            type="button"
            disabled={!pdfDoc || !numPages}
            onClick={() => setPreviewOpen(true)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:pointer-events-none shrink-0"
            title="Page previews"
            aria-label="Open page previews"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!numPages || currentPage >= numPages}
            onClick={() => onGoToPage(currentPage + 1)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-35 disabled:pointer-events-none shrink-0"
            title={withShortcut(
              numPages ? `Next page (${currentPage + 1} of ${numPages})` : "Next page",
              "right"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {!compact && modeHint ? (
        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
          {modeHint}
        </p>
        ) : null}
        {previewOpen && pdfDoc && numPages > 0 && (
          <PdfPagePreviewModal
            pdfDoc={pdfDoc}
            numPages={numPages}
            currentPage={currentPage}
            canDeletePages={canDeletePages}
            deleting={deletingPages}
            onGoToPage={onGoToPage}
            onDeletePages={async (pages) => {
              await onDeletePages?.(pages);
              setPreviewOpen(false);
            }}
            onClose={() => {
              if (!deletingPages) setPreviewOpen(false);
            }}
          />
        )}
    </div>
  );
}
