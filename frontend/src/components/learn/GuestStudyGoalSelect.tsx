"use client";

import { STUDY_GOAL_GROUPS, STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";
import { Target } from "lucide-react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

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
      <ShelfSelect
        value={value}
        disabled={disabled}
        groups={STUDY_GOAL_GROUPS.map((group) => ({
          label: group.label,
          options: group.options.map((goal) => ({
            value: goal,
            label: STUDY_GOAL_LABELS[goal],
          })),
        }))}
        aria-label="Study goal"
        className={`rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60 ${
          compact
            ? "select-compact text-sm py-2 pl-2.5 min-w-[10rem]"
            : "text-sm py-2 pl-3 w-full sm:min-w-[12rem]"
        }`}
        onChange={(next) => onChange(next as StudyGoal)}
      />
    </label>
  );
}
