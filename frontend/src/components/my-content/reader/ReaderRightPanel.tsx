"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { StudyPanel } from "@/components/StudyPanel";

type ReaderRightPanelProps = {
  onClose: () => void;
  studyPageId: string | null;
  studyEmbed: boolean;
  askSelection: string | null;
  askImage?: string;
  attachNote?: (note: string) => Promise<void>;
  onClearSelection: () => void;
  capturePdfPage: () => string;
};

export function ReaderRightPanel({
  onClose,
  studyPageId,
  studyEmbed,
  askSelection,
  askImage,
  attachNote,
  onClearSelection,
  capturePdfPage,
}: ReaderRightPanelProps) {
  const studySubtitle = studyEmbed
    ? "Ask about this linked page"
    : askSelection
      ? "Ask about the highlight"
      : "Ask about this file";

  return (
    <div className="h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 shrink-0 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
              Study AI
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {studySubtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/study-ai"
            className="text-[11px] text-[var(--accent)] hover:underline px-1"
          >
            All chats
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            title="Hide Study AI"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-4 py-3">
        {studyPageId ? (
          <StudyPanel
            userTopicId={studyPageId}
            selection={askSelection}
            imageBase64={askImage}
            getPageImage={capturePdfPage}
            onClearSelection={onClearSelection}
            onAttachNote={attachNote}
            embedMode={studyEmbed}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Open a page to ask Study AI about it.
          </p>
        )}
      </div>
    </div>
  );
}
