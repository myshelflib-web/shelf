"use client";

import Link from "next/link";
import { Highlighter, Sparkles, X } from "lucide-react";
import clsx from "clsx";
import { StudyPanel } from "@/components/StudyPanel";
import type { UserContentHighlight } from "@/types";
import { HighlightsPanel } from "./HighlightsPanel";

export type ReaderRightPanelTab = "study-ai" | "highlights";

type ReaderRightPanelProps = {
  tab: ReaderRightPanelTab;
  onTabChange: (tab: ReaderRightPanelTab) => void;
  onClose: () => void;
  studyPageId: string | null;
  studyEmbed: boolean;
  askSelection: string | null;
  askImage?: string;
  attachNote?: (note: string) => Promise<void>;
  onClearSelection: () => void;
  capturePdfPage: () => string;
  highlights: UserContentHighlight[];
  highlightsHydrating: boolean;
  isPdf: boolean;
  onHighlightSelect: (highlight: UserContentHighlight) => void;
};

export function ReaderRightPanel({
  tab,
  onTabChange,
  onClose,
  studyPageId,
  studyEmbed,
  askSelection,
  askImage,
  attachNote,
  onClearSelection,
  capturePdfPage,
  highlights,
  highlightsHydrating,
  isPdf,
  onHighlightSelect,
}: ReaderRightPanelProps) {
  const studySubtitle = studyEmbed
    ? "Ask about this linked page"
    : askSelection
      ? "Ask about the highlight"
      : "Ask about this file";

  return (
    <div className="h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="shrink-0 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)] shrink-0">
              {tab === "study-ai" ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <Highlighter className="w-3.5 h-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                {tab === "study-ai" ? "Study AI" : "Highlights & notes"}
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {tab === "study-ai"
                  ? studySubtitle
                  : "Jump back to any snippet on this page"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {tab === "study-ai" ? (
              <Link
                href="/study-ai"
                className="text-[11px] text-[var(--accent)] hover:underline px-1"
              >
                All chats
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              title="Hide panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-2">
          <button
            type="button"
            onClick={() => onTabChange("study-ai")}
            className={clsx(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              tab === "study-ai"
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            Study AI
          </button>
          <button
            type="button"
            onClick={() => onTabChange("highlights")}
            className={clsx(
              "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
              tab === "highlights"
                ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            Highlights
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-4 py-3">
        {tab === "study-ai" ? (
          studyPageId ? (
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
          )
        ) : studyPageId ? (
          <HighlightsPanel
            highlights={highlights}
            hydrating={highlightsHydrating}
            isPdf={isPdf}
            onSelect={onHighlightSelect}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Open a page to browse its highlights and notes.
          </p>
        )}
      </div>
    </div>
  );
}
