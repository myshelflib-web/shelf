"use client";

import { STUDY_GOAL_GROUPS, STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";
import { Target } from "lucide-react";

export function GuestStudyGoalSelect({
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  value: StudyGoal;
  onChange: (goal: StudyGoal) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 min-w-0 ${
        compact ? "" : "w-full sm:w-auto"
      }`}
    >
      {!compact && (
        <span className="text-xs text-[var(--text-muted)] shrink-0 flex items-center gap-1">
          <Target className="w-3.5 h-3.5" />
          Your goal
        </span>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as StudyGoal)}
        className={`rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60 ${
          compact
            ? "text-sm py-2 pl-2.5 pr-8 min-w-[10rem]"
            : "text-sm py-2 pl-3 pr-9 w-full sm:min-w-[12rem]"
        }`}
        aria-label="Study goal"
      >
        {STUDY_GOAL_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((goal) => (
              <option key={goal} value={goal}>
                {STUDY_GOAL_LABELS[goal]}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
