"use client";

import clsx from "clsx";
import { Trash2, X } from "lucide-react";
import {
  summarizeBulkDelete,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";

interface BulkDeleteModalProps {
  open: boolean;
  selected: Set<ExplorerSelectionKey>;
  labels: Map<ExplorerSelectionKey, string>;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function kindLabel(kind: "subject" | "topic" | "page") {
  if (kind === "subject") return "Collection";
  if (kind === "topic") return "Topic";
  return "Page";
}

export function BulkDeleteModal({
  open,
  selected,
  labels,
  deleting,
  onClose,
  onConfirm,
}: BulkDeleteModalProps) {
  if (!open) return null;

  const items = summarizeBulkDelete(selected, labels);

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-delete-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={deleting ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
          <div>
            <h2
              id="bulk-delete-title"
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              Delete {items.length} item{items.length === 1 ? "" : "s"}?
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              This cannot be undone. Topics and pages inside a selected collection
              are removed too.
            </p>
          </div>
          <button
            type="button"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Close"
            disabled={deleting}
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="max-h-52 overflow-y-auto px-4 py-3 space-y-1.5">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-2 text-sm min-w-0"
            >
              <span className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-muted)] shrink-0 w-16">
                {kindLabel(item.kind)}
              </span>
              <span className="truncate text-[var(--text-secondary)]">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border)]">
          <button
            type="button"
            className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            disabled={deleting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={clsx(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold",
              "bg-red-600 text-white hover:bg-red-500 disabled:opacity-60"
            )}
            disabled={deleting || items.length === 0}
            onClick={onConfirm}
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
