"use client";

import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  GraduationCap,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { DashboardAchievementsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import {
  AchievementId,
  dashboardAchievementState,
} from "@/lib/dashboardAchievements";

const ICONS: Record<AchievementId, LucideIcon> = {
  "first-read": Footprints,
  "three-day": Flame,
  week: Trophy,
  library: GraduationCap,
  regular: CalendarCheck,
  fortnight: Zap,
  month: Star,
  legend: Crown,
};

export function DashboardAchievements({
  streak,
  activeDays,
  hasLibrary,
  loading = false,
}: {
  streak: number;
  activeDays: number;
  hasLibrary: boolean;
  loading?: boolean;
}) {
  const rows = useMemo(
    () =>
      dashboardAchievementState({
        streak,
        activeDays,
        hasLibrary,
      }),
    [streak, activeDays, hasLibrary]
  );
  const earned = rows.filter((r) => r.earned).length;

  if (loading) return <DashboardAchievementsSkeleton />;

  return (
    <section className="shrink-0">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Achievements</h2>
        <span className="text-xs text-[var(--text-muted)] tabular-nums">
          {earned} / {rows.length}
        </span>
      </div>
      <div className="grid grid-cols-8 gap-2">
        {rows.map((row) => {
          const Icon = ICONS[row.id];
          return (
            <div
              key={row.id}
              title={`${row.label} · ${row.hint}${row.earned ? "" : " (locked)"}`}
              aria-label={`${row.label}: ${row.hint}${row.earned ? "" : ", locked"}`}
              className={`aspect-square rounded-[10px] flex items-center justify-center ${
                row.earned
                  ? "border border-[var(--border)] bg-[var(--bg-elevated)]"
                  : "border border-dashed border-[var(--border)]"
              }`}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={1.7}
                style={{
                  color: row.earned ? row.color : "var(--text-muted)",
                  opacity: row.earned ? 1 : 0.38,
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
