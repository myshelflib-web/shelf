"use client";

import { Loader2 } from "lucide-react";

export function PdfDeleteUndoBar({
  undoCount,
  undoing,
  onUndo,
  onDismiss,
}: {
  undoCount: number;
  undoing: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  if (undoCount <= 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-[60] -translate-x-1/2 px-3 w-full max-w-md">
      <div className="pointer-events-auto flex items-center gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg px-3 py-2">
        <p className="text-sm text-[var(--text-secondary)] min-w-0 flex-1">
          Pages deleted
          {undoCount > 1 ? (
            <span className="text-[var(--text-muted)]">
              {" "}
              · {undoCount} undos left
            </span>
          ) : null}
        </p>
        <button
          type="button"
          disabled={undoing}
          onClick={onUndo}
          className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-[var(--accent-light)] text-[var(--accent)] hover:opacity-90 disabled:opacity-50"
        >
          {undoing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Undo
        </button>
        <button
          type="button"
          disabled={undoing}
          onClick={onDismiss}
          className="shrink-0 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-1"
          aria-label="Dismiss undo"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
