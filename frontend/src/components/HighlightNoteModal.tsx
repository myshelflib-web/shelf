"use client";

import { useEffect, useState } from "react";
import { StickyNote, Trash2, X } from "lucide-react";

interface HighlightNoteModalProps {
  quote: string;
  initialNote?: string;
  onSave: (note: string) => Promise<void> | void;
  onClose: () => void;
  /** Clear the note text only */
  onDeleteNote?: () => Promise<void> | void;
  /** Delete the entire highlight */
  onRemoveHighlight?: () => Promise<void> | void;
}

export function HighlightNoteModal({
  quote,
  initialNote = "",
  onSave,
  onClose,
  onDeleteNote,
  onRemoveHighlight,
}: HighlightNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close note"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Highlight"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <StickyNote className="w-4 h-4 text-[var(--accent)]" />
            Highlight
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-4 border-l-2 border-[var(--accent)] pl-2">
          “{quote}”
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          autoFocus
          placeholder="Write a note on this highlight…"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm p-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="flex items-center justify-end gap-2 mt-3">
          {onDeleteNote && initialNote.trim() ? (
            <button
              type="button"
              className="mr-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              onClick={async () => {
                await onDeleteNote();
                onClose();
              }}
            >
              Clear note
            </button>
          ) : (
            <span className="mr-auto" />
          )}
          <button
            type="button"
            className="btn-secondary text-xs py-1.5"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary text-xs py-1.5"
            disabled={saving || !note.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(note.trim());
                onClose();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save note"}
          </button>
        </div>
        {onRemoveHighlight && (
          <button
            type="button"
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
            title="Delete this highlight permanently"
            disabled={removing}
            onClick={async () => {
              setRemoving(true);
              try {
                await onRemoveHighlight();
                onClose();
              } finally {
                setRemoving(false);
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {removing ? "Removing…" : "Remove highlight"}
          </button>
        )}
      </div>
    </div>
  );
}
