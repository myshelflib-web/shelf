"use client";

import { Globe } from "lucide-react";
import {
  setStoredStudyWebSearch,
  type StudyWebSearchScope,
} from "@/lib/studyWebSearch";

export function StudyAiWebSearchToggle({
  scope,
  enabled,
  onChange,
  disabled,
  compact,
  iconOnly,
}: {
  scope: StudyWebSearchScope;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="Web search"
      title={
        enabled
          ? "Web search on — may search Google for facts outside this PDF"
          : "Web search off — answers stay in your library and this file"
      }
      disabled={disabled}
      onClick={() => {
        const next = !enabled;
        setStoredStudyWebSearch(scope, next);
        onChange(next);
      }}
      className={`no-focus-ring shrink-0 flex items-center justify-center transition-colors disabled:opacity-40 ${
        iconOnly
          ? `w-8 h-8 rounded-full ${
              enabled
                ? "text-[var(--accent)] bg-[var(--accent-subtle)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            }`
          : `rounded-[9px] border gap-1.5 ${compact ? "h-8 px-1.5" : "h-9 px-2"} ${
              enabled
                ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
            }`
      }`}
    >
      <Globe className="w-4 h-4 shrink-0" />
      {!iconOnly && (
        <span className="hidden sm:inline text-[11px] font-semibold max-w-[4.5rem] truncate">
          Web
        </span>
      )}
    </button>
  );
}
