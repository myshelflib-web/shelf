"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDialog } from "@/hooks/useAppDialog";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Loader2, Trash2, X } from "lucide-react";

const THUMB_SCALE = 0.22;
const THUMB_BATCH = 4;

function Thumbnail({
  pdfDoc,
  pageNum,
  active,
  marked,
  canDelete,
  onSelect,
  onToggleDelete,
}: {
  pdfDoc: PDFDocumentProxy;
  pageNum: number;
  active: boolean;
  marked: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onToggleDelete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let cancelled = false;
    let task: { cancel: () => void } | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        void (async () => {
          try {
            const page = await pdfDoc.getPage(pageNum);
            if (cancelled) return;
            const viewport = page.getViewport({ scale: THUMB_SCALE });
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              setFailed(true);
              return;
            }
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const renderTask = page.render({
              canvasContext: ctx,
              viewport,
              background: "#ffffff",
            });
            task = renderTask;
            await renderTask.promise;
            if (!cancelled) setReady(true);
          } catch {
            if (!cancelled) setFailed(true);
          }
        })();
      },
      { root: wrap.closest("[data-pdf-thumbs]"), rootMargin: "120px", threshold: 0.01 }
    );
    observer.observe(wrap);

    return () => {
      cancelled = true;
      observer.disconnect();
      try {
        task?.cancel();
      } catch {
        /* already finished */
      }
    };
  }, [pdfDoc, pageNum]);

  return (
    <div
      ref={wrapRef}
      className={`group relative flex flex-col items-center gap-1.5 rounded-[10px] border p-1.5 transition ${
        marked
          ? "border-red-500/70 bg-red-500/10"
          : active
            ? "border-[var(--accent)] bg-[var(--accent-light)] ring-1 ring-[var(--accent)]"
            : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden rounded-md bg-[var(--bg-primary)]"
        aria-label={`Go to page ${pageNum}`}
        aria-current={active ? "page" : undefined}
      >
        {!ready && !failed && (
          <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
        )}
        {failed && (
          <span className="text-[10px] text-[var(--text-muted)]">—</span>
        )}
        <canvas
          ref={canvasRef}
          className={`max-w-full max-h-full object-contain ${ready ? "opacity-100" : "opacity-0 absolute"}`}
        />
      </button>
      <div className="flex w-full items-center justify-between gap-1 px-0.5">
        <span
          className={`text-[11px] tabular-nums ${
            marked
              ? "text-red-400 font-medium"
              : active
                ? "text-[var(--accent)] font-medium"
                : "text-[var(--text-muted)]"
          }`}
        >
          {pageNum}
        </span>
        {canDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDelete();
            }}
            className={`p-1 rounded-md transition ${
              marked
                ? "text-red-400 bg-red-500/15"
                : "text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10"
            }`}
            title={marked ? "Keep this page" : "Mark page for deletion"}
            aria-label={
              marked ? `Unmark page ${pageNum}` : `Delete page ${pageNum}`
            }
            aria-pressed={marked}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PdfPagePreviewModal({
  pdfDoc,
  numPages,
  currentPage,
  canDeletePages = false,
  deleting = false,
  onGoToPage,
  onDeletePages,
  onClose,
}: {
  pdfDoc: PDFDocumentProxy;
  numPages: number;
  currentPage: number;
  canDeletePages?: boolean;
  deleting?: boolean;
  onGoToPage: (page: number) => void;
  onDeletePages?: (pages: number[]) => void | Promise<void>;
  onClose: () => void;
}) {
  const { confirm } = useAppDialog();
  const [visibleCount, setVisibleCount] = useState(Math.min(numPages, 24));
  const [marked, setMarked] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, deleting]);

  useEffect(() => {
    if (visibleCount >= numPages) return;
    const id = window.setTimeout(() => {
      setVisibleCount((n) => Math.min(numPages, n + THUMB_BATCH * 3));
    }, 40);
    return () => window.clearTimeout(id);
  }, [visibleCount, numPages]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-page="${currentPage}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [currentPage]);

  const pages = Array.from({ length: visibleCount }, (_, i) => i + 1);
  const markedList = [...marked].sort((a, b) => a - b);
  const canConfirm =
    canDeletePages &&
    markedList.length > 0 &&
    markedList.length < numPages &&
    !deleting;

  const toggleMark = (pageNum: number) => {
    setError("");
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(pageNum)) next.delete(pageNum);
      else next.add(pageNum);
      return next;
    });
  };

  const confirmDelete = async () => {
    if (!onDeletePages || !canConfirm) return;
    if (markedList.length >= numPages) {
      setError("Keep at least one page");
      return;
    }
    const label =
      markedList.length === 1
        ? `Delete page ${markedList[0]}?`
        : `Delete ${markedList.length} pages (${markedList.join(", ")})?`;
    const ok = await confirm({
      title: "Delete PDF pages",
      message: `${label}\nThis permanently updates the PDF.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    onClose();
    void onDeletePages?.(markedList);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!deleting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-label="Page previews"
        className="relative flex max-h-[min(36rem,88vh)] w-full max-w-2xl flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 shrink-0">
          <div>
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">
              Pages
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              {numPages} pages · click a preview to jump
              {canDeletePages ? " · mark pages with trash to delete" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] disabled:opacity-40"
            aria-label="Close page previews"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div
          ref={listRef}
          data-pdf-thumbs
          className="overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5"
        >
          {pages.map((pageNum) => (
            <div key={pageNum} data-page={pageNum}>
              <Thumbnail
                pdfDoc={pdfDoc}
                pageNum={pageNum}
                active={pageNum === currentPage}
                marked={marked.has(pageNum)}
                canDelete={canDeletePages}
                onSelect={() => {
                  if (deleting) return;
                  onGoToPage(pageNum);
                  onClose();
                }}
                onToggleDelete={() => toggleMark(pageNum)}
              />
            </div>
          ))}
        </div>
        {(canDeletePages || error) && (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 shrink-0">
            <p className="text-[11px] text-[var(--text-muted)] min-w-0 truncate">
              {error ? (
                <span className="text-red-400">{error}</span>
              ) : markedList.length === 0 ? (
                "Mark pages to remove them from this PDF"
              ) : markedList.length >= numPages ? (
                <span className="text-red-400">Keep at least one page</span>
              ) : (
                `${markedList.length} selected`
              )}
            </p>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={() => void confirmDelete()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-red-500/15 text-red-400 hover:bg-red-500/25 disabled:opacity-40 disabled:pointer-events-none"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {deleting
                ? "Deleting…"
                : markedList.length
                  ? `Delete ${markedList.length}`
                  : "Delete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
