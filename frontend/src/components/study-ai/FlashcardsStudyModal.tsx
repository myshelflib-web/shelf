"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FolderPlus,
  RotateCcw,
  X,
} from "lucide-react";
import type { Flashcard } from "@/lib/parseFlashcards";
import { flashcardsToMarkdown } from "@/lib/parseFlashcards";
import { downloadAnswer } from "@/lib/exportAnswer";

export function FlashcardsStudyModal({
  cards,
  title = "Flashcards",
  onClose,
  onSave,
}: {
  cards: Flashcard[];
  title?: string;
  onClose: () => void;
  onSave: (markdown: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [busy, setBusy] = useState(false);
  const total = cards.length;
  const card = cards[index] ?? cards[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        setFlipped(false);
        setIndex((i) => Math.min(total - 1, i + 1));
      }
      if (e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        setFlipped(false);
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, total]);

  const deckMd = flashcardsToMarkdown(cards, title);

  const download = useCallback(async () => {
    setBusy(true);
    try {
      await downloadAnswer("md", title, deckMd);
    } finally {
      setBusy(false);
    }
  }, [deckMd, title]);

  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Study flashcards"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
          <div>
            <p className="text-[13px] font-medium text-[var(--text-primary)]">
              {title}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Card {index + 1} of {total} · Space to flip · ← → to move
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="w-full min-h-[220px] px-6 py-8 text-left bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
        >
          <p className="text-[10px] uppercase tracking-wide text-[var(--accent)] mb-3">
            {flipped ? "Answer" : "Question"}
          </p>
          <p className="text-[16px] leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
            {flipped ? card.back : card.front}
          </p>
          <p className="mt-6 text-[11px] text-[var(--text-muted)] inline-flex items-center gap-1">
            <RotateCcw className="w-3 h-3" />
            Tap to flip
          </p>
        </button>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => {
              setFlipped(false);
              setIndex((i) => Math.max(0, i - 1));
            }}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => void download()}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={() => onSave(deckMd)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-[12px] text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={() => {
              setFlipped(false);
              setIndex((i) => Math.min(total - 1, i + 1));
            }}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
