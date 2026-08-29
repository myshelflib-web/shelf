"use client";

import {
  CheckCircle2,
  Sparkles,
  Pencil,
  Save,
  X,
  CalendarDays,
} from "lucide-react";
import clsx from "clsx";
import { withShortcut } from "@/lib/hotkeys";

interface ReaderBottomBarProps {
  completed: boolean;
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
  completed,
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
  const pillBtn =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition";

  return (
    <div className="reader-bottom-bar pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
      <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] shadow-[0_8px_28px_rgba(0,0,0,0.14)] max-w-full overflow-x-auto">
        {editing ? (
          autosave ? (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              title={withShortcut("Done editing", "escape")}
              className={clsx(
                pillBtn,
                "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              {saving ? "Saving…" : "Done"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                title={withShortcut("Save changes", "mod+s")}
                className={clsx(
                  pillBtn,
                  "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                )}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={saving}
                title={withShortcut("Discard edits", "escape")}
                className={clsx(
                  pillBtn,
                  "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                )}
              >
                <X className="w-4 h-4" />
                Cancel
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
                className={clsx(
                  pillBtn,
                  "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                )}
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
                  pillBtn,
                  "text-[var(--accent)] bg-[var(--accent-light)] hover:opacity-90",
                  lockedBtn
                )}
              >
                <Sparkles className="w-4 h-4" />
                Study AI
              </button>
            )}
            {onScheduleRead && (
              <button
                type="button"
                onClick={onScheduleRead}
                className={clsx(
                  pillBtn,
                  scheduled
                    ? "text-[var(--accent)] bg-[var(--accent-light)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                )}
                title={withShortcut(
                  scheduled
                    ? "Already scheduled — add another reading time"
                    : "Add this page to the planner",
                  "s"
                )}
              >
                <CalendarDays className="w-4 h-4" />
                Add to Planner
              </button>
            )}
            <button
              type="button"
              onClick={() => guard(onToggleComplete, "Mark as complete")}
              aria-disabled={guestLocked}
              className={clsx(
                pillBtn,
                lockedBtn,
                !guestLocked &&
                  (completed
                    ? "text-[var(--accent)] bg-[var(--accent-light)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]")
              )}
              title={
                guestLocked
                  ? "Sign in to track progress"
                  : withShortcut(
                      completed
                        ? "Mark as not done"
                        : "Mark this page as done",
                      "x"
                    )
              }
            >
              <CheckCircle2 className="w-4 h-4" />
              {completed ? "Done" : "Mark done"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
