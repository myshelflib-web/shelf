"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { ActivityMonthGrid } from "@/components/ActivityMonthGrid";
import { getReadingStats } from "@/lib/readingStats";
import { earnedMedals } from "@/lib/streakMedals";
import { localYmd } from "@/lib/monthGrid";
import { useAuth } from "@/hooks/useAuth";

export function StreakPopover() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => new Date());
  const [stats, setStats] = useState(() =>
    typeof window === "undefined"
      ? { streak: 0, lastActiveDate: "", todaySeconds: 0, activeDates: [] as string[] }
      : getReadingStats()
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => setStats(getReadingStats());
    refresh();
    window.addEventListener("shelf:reading-stats-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("shelf:reading-stats-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = localYmd(new Date());
  const medals = earnedMedals(stats.streak).length;
  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-[color-mix(in_srgb,#b8a06a_35%,var(--border))] bg-[color-mix(in_srgb,#b8a06a_14%,var(--bg-elevated))] text-[#c9a066] text-[13px] font-medium tabular-nums"
        aria-expanded={open}
        aria-label={`${stats.streak} day streak`}
      >
        <Flame className="w-3.5 h-3.5" fill="currentColor" />
        {stats.streak}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[20rem] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-[var(--accent-light)] text-[var(--accent)] inline-flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" fill="currentColor" strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-lg font-semibold leading-tight tabular-nums">
                  {stats.streak} {stats.streak === 1 ? "day" : "days"}
                </p>
                <p className="text-[12px] text-[var(--text-muted)]">Current streak</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[12px] text-[var(--accent)] tabular-nums">
              <Trophy className="w-3.5 h-3.5" />
              {medals}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-[13px] font-medium">{monthLabel}</p>
            <button
              type="button"
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              aria-label="Next month"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <ActivityMonthGrid
            year={year}
            month={month}
            activeDates={stats.activeDates}
            today={today}
          />

          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3 mt-3 border-t border-[var(--border)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Active days
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <CalendarDays className="w-3 h-3" />
              {stats.activeDates.length} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
