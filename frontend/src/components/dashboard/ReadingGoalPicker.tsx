"use client";

import { READING_GOAL_MINUTES, setReadingGoalMinutes } from "@/lib/readingStats";

export function ReadingGoalPicker({
  value,
  onChange,
  compact = false,
}: {
  value: number;
  onChange?: (minutes: number) => void;
  compact?: boolean;
}) {
  const pick = (m: number) => {
    setReadingGoalMinutes(m);
    onChange?.(m);
  };

  return (
    <div
      className={`flex flex-wrap gap-1 mt-2 ${compact ? "justify-center" : ""}`}
      role="group"
      aria-label="Daily reading goal"
    >
      {READING_GOAL_MINUTES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => pick(m)}
          className={`goal-chip ${compact ? "goal-chip-compact" : ""} ${value === m ? "goal-chip-active" : ""}`}
        >
          {m}m
        </button>
      ))}
    </div>
  );
}
