"use client";

import { Search } from "lucide-react";
import { GuestStudyGoalSelect } from "@/components/learn/GuestStudyGoalSelect";
import { StudyGoal } from "@/types";

export function LearnCatalogToolbar({
  studyGoal,
  onStudyGoalChange,
  showGoalPicker,
  search,
  onSearchChange,
  variant = "default",
}: {
  studyGoal: StudyGoal;
  onStudyGoalChange: (goal: StudyGoal) => void;
  showGoalPicker: boolean;
  search: string;
  onSearchChange: (q: string) => void;
  /** "catalog" uses the warm learn-page toolbar shell. */
  variant?: "default" | "catalog";
}) {
  const isCatalog = variant === "catalog";

  if (isCatalog) {
    return (
      <div className="learn-toolbar">
        {showGoalPicker && (
          <div className="learn-toolbar-filter">
            <GuestStudyGoalSelect
              value={studyGoal}
              onChange={onStudyGoalChange}
              catalogFilter
              compact
            />
          </div>
        )}
        <div className="learn-toolbar-search">
          <Search className="learn-toolbar-search-icon" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search subjects, topics, articles…"
            aria-label="Search curriculum"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 mb-2 flex flex-col sm:flex-row gap-3 sm:items-center">
      {showGoalPicker && (
        <GuestStudyGoalSelect
          value={studyGoal}
          onChange={onStudyGoalChange}
          catalogFilter
        />
      )}
      <div className="relative flex-1 min-w-[12rem]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search subjects, topics, articles…"
          className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
    </div>
  );
}
