"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  Sparkles,
  Pencil,
  Save,
  X,
  CalendarDays,
} from "lucide-react";
import clsx from "clsx";
import { withShortcut } from "@/lib/hotkeys";

interface NavItem {
  href: string;
  title: string;
}

interface PdfNav {
  page: number;
  numPages: number;
  onPrev: () => void;
  onNext: () => void;
}

interface ReaderBottomBarProps {
  prev?: NavItem | null;
  next?: NavItem | null;
  pdf?: PdfNav | null;
  starred: boolean;
  completed: boolean;
  onToggleStar: () => void;
  onToggleComplete: () => void;
  onOpenStudyAI: () => void;
  onScheduleRead?: () => void;
  scheduled?: boolean;
  editing?: boolean;
  saving?: boolean;
  autosave?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancelEdit?: () => void;
  showStudyAI?: boolean;
  /** Account-only controls stay visible but muted for guests. */
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
}

export function ReaderBottomBar({
  prev = null,
  next = null,
  pdf = null,
  starred,
  completed,
  onToggleStar,
  onToggleComplete,
  onOpenStudyAI,
  onScheduleRead,
  scheduled = false,
  editing = false,
  saving = false,
  autosave = false,
  onEdit,
  onSave,
  onCancelEdit,
  showStudyAI = true,
  guestLocked = false,
  onGuestLockedClick,
}: ReaderBottomBarProps) {
  const guard = (action: () => void, feature: string) => {
    if (guestLocked) {
      onGuestLockedClick?.(feature);
      return;
    }
    action();
  };
  const lockedBtn = guestLocked
    ? "opacity-45 cursor-not-allowed saturate-[0.85] hover:!bg-transparent hover:!text-[var(--text-secondary)]"
    : "";
  const pdfPrev = pdf && pdf.page > 1;
  const pdfNext = pdf && pdf.page < pdf.numPages;

  return (
    <div className="reader-bottom-bar border-t border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-sm px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
      {pdf ? (
        pdfPrev ? (
          <button
            type="button"
            onClick={pdf.onPrev}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition min-w-0 max-w-[28%] sm:max-w-[30%]"
            title={withShortcut(
              `Previous page (${pdf.page - 1} of ${pdf.numPages})`,
              "left"
            )}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="truncate tabular-nums">Page {pdf.page - 1}</span>
          </button>
        ) : (
          <div className="w-[28%]" />
        )
      ) : prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition min-w-0 max-w-[28%] sm:max-w-[30%]"
          title={`Previous: ${prev.title}`}
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span className="truncate">{prev.title}</span>
        </Link>
      ) : (
        <div className="w-[28%]" />
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {editing ? (
          autosave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              title={withShortcut("Done editing", "escape")}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">
                {saving ? "Saving…" : "Done"}
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                title={withShortcut("Save changes", "mod+s")}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {saving ? "Saving…" : "Save"}
                </span>
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={saving}
                title={withShortcut("Discard edits", "escape")}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            </>
          )
        ) : (
          <>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                title={withShortcut("Edit this page", "e")}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm transition text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              >
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {showStudyAI && (
              <button
                type="button"
                onClick={() => guard(onOpenStudyAI, "Use Study AI")}
                title={
                  guestLocked
                    ? "Sign in to use Study AI"
                    : withShortcut(
                        "Ask Study AI — uses selected text if any",
                        "mod+l"
                      )
                }
                aria-disabled={guestLocked}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm transition text-[var(--accent)] bg-[var(--accent-light)] hover:opacity-90",
                  lockedBtn
                )}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Study AI</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => guard(onToggleStar, "Star articles")}
              aria-disabled={guestLocked}
              className={clsx(
                "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm transition",
                lockedBtn,
                !guestLocked &&
                  (starred
                    ? "text-amber-400 bg-amber-400/15"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]")
              )}
              title={
                guestLocked
                  ? "Sign in to star pages"
                  : withShortcut(
                      starred ? "Remove star" : "Star this page",
                      "*"
                    )
              }
            >
              <Star
                className={clsx(
                  "w-4 h-4",
                  starred && "fill-amber-400 text-amber-400"
                )}
              />
              <span className="hidden md:inline">Star</span>
            </button>
            {onScheduleRead && (
              <button
                type="button"
                onClick={onScheduleRead}
                className={clsx(
                  "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm transition",
                  scheduled
                    ? "text-[var(--accent)] bg-[var(--accent-light)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                )}
                title={withShortcut(
                  scheduled
                    ? "Already scheduled — add another reading time"
                    : "Schedule this page for reading",
                  "s"
                )}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden md:inline">Schedule</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => guard(onToggleComplete, "Mark as complete")}
              aria-disabled={guestLocked}
              className={clsx(
                "flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-sm transition",
                lockedBtn,
                !guestLocked &&
                  (completed
                    ? "text-[var(--accent)] bg-[var(--accent-light)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]")
              )}
              title={
                guestLocked
                  ? "Sign in to track progress"
                  : withShortcut(
                      completed ? "Mark as not done" : "Mark this page as done",
                      "x"
                    )
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden md:inline">
                {completed ? "Done" : "Mark done"}
              </span>
            </button>
          </>
        )}
      </div>

      {pdf ? (
        pdfNext ? (
          <button
            type="button"
            onClick={pdf.onNext}
            className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition min-w-0 max-w-[28%] sm:max-w-[30%] justify-end"
            title={withShortcut(
              `Next page (${pdf.page + 1} of ${pdf.numPages})`,
              "right"
            )}
          >
            <span className="truncate tabular-nums">Page {pdf.page + 1}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        ) : (
          <div className="w-[28%]" />
        )
      ) : next ? (
        <Link
          href={next.href}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition min-w-0 max-w-[28%] sm:max-w-[30%] justify-end"
          title={`Next: ${next.title}`}
        >
          <span className="truncate">{next.title}</span>
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      ) : (
        <div className="w-[28%]" />
      )}
    </div>
  );
}
