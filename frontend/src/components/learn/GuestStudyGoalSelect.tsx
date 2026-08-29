"use client";

import {
  LEARN_CATALOG_GOAL_GROUPS,
  LEARN_CATALOG_GOAL_LABELS,
  STUDY_GOAL_GROUPS,
  STUDY_GOAL_LABELS,
} from "@/lib/studyGoal";
import { StudyGoal } from "@/types";
import { Filter } from "lucide-react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export function GuestStudyGoalSelect({
  value,
  onChange,
  disabled = false,
  compact = false,
  catalogFilter = false,
}: {
  value: StudyGoal;
  onChange: (goal: StudyGoal) => void;
  disabled?: boolean;
  compact?: boolean;
  /** Use catalog labels (GENERAL → "All tracks") and filter copy. */
  catalogFilter?: boolean;
}) {
  const labels = catalogFilter ? LEARN_CATALOG_GOAL_LABELS : STUDY_GOAL_LABELS;
  const groups = catalogFilter ? LEARN_CATALOG_GOAL_GROUPS : STUDY_GOAL_GROUPS;

  return (
    <label
      className={`flex items-center gap-2 min-w-0 ${
        compact ? "" : "w-full sm:w-auto"
      }`}
    >
      {!compact && (
        <span className="text-xs text-[var(--text-muted)] shrink-0 flex items-center gap-1 whitespace-nowrap">
          <Filter className="w-3.5 h-3.5" />
          {catalogFilter ? "Filter track" : "Your goal"}
        </span>
      )}
      <ShelfSelect
        value={value}
        disabled={disabled}
        groups={groups.map((group) => ({
          label: group.label,
          options: group.options.map((goal) => ({
            value: goal,
            label: labels[goal],
          })),
        }))}
        aria-label={catalogFilter ? "Filter by exam track" : "Study goal"}
        className={`rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60 ${
          compact
            ? "select-compact text-sm py-2 pl-2.5 min-w-[10rem]"
            : "text-sm py-2 pl-3 w-full sm:min-w-[11rem]"
        }`}
        onChange={(next) => onChange(next as StudyGoal)}
      />
    </label>
  );
}
