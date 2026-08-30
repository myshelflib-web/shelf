"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";
import { PdfPagePreviewModal } from "./PdfPagePreviewModal";
import { ToolBtn, ToolMuted, ToolPill } from "./EditorToolbarChrome";

export function PdfPageNav({
  currentPage,
  numPages,
  modeHint = "",
  pdfDoc,
  compact = false,
  phone = false,
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
  phone?: boolean;
  canDeletePages?: boolean;
  deletingPages?: boolean;
  onGoToPage: (page: number) => void;
  onDeletePages?: (pages: number[]) => void | Promise<void>;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusedRef = useRef(false);
  const [previewOpen, setPreviewOpen] = useState(false);

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
        <ToolBtn
          phone={phone}
          label={withShortcut(
            numPages
              ? `Previous page (${currentPage - 1} of ${numPages})`
              : "Previous page",
            "left"
          )}
          disabled={!numPages || currentPage <= 1}
          onClick={() => onGoToPage(currentPage - 1)}
        >
          <ChevronLeft className="w-[17px] h-[17px]" />
        </ToolBtn>
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
          <ToolMuted>{phone ? null : "Page"}</ToolMuted>
          <ToolPill className={phone ? "!min-w-0 !h-8" : undefined}>
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
                e.stopPropagation();
                if (e.key === "Escape") {
                  focusedRef.current = false;
                  e.currentTarget.value = String(currentPage);
                  e.currentTarget.blur();
                }
              }}
              className={`bg-transparent text-center font-medium tabular-nums text-[var(--text-primary)] outline-none disabled:opacity-50 ${
                phone ? "h-8 w-9 text-[11px]" : "h-[34px] w-[52px] text-[12px]"
              }`}
              aria-label="Go to page number"
              title="Go to page"
            />
          </ToolPill>
          <ToolMuted>/ {numPages || "—"}</ToolMuted>
        </form>
        <ToolBtn
          phone={phone}
          label={withShortcut(
            numPages
              ? `Next page (${currentPage + 1} of ${numPages})`
              : "Next page",
            "right"
          )}
          disabled={!numPages || currentPage >= numPages}
          onClick={() => onGoToPage(currentPage + 1)}
        >
          <ChevronRight className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          phone={phone}
          label="Page thumbnails"
          disabled={!pdfDoc || !numPages}
          onClick={() => setPreviewOpen(true)}
        >
          <LayoutGrid className="w-[17px] h-[17px]" />
        </ToolBtn>
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
