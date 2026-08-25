"use client";

import type { ReactNode } from "react";
import { Clock, Flame } from "lucide-react";
import { DashboardMetricsSkeleton } from "@/components/dashboard/DashboardSkeletons";

function formatReadingToday(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-1 sm:flex-none items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 min-w-0 sm:min-w-[9.5rem]">
      <span className="w-7 h-7 rounded-lg bg-[var(--accent-light)] text-[var(--accent)] inline-flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="leading-tight min-w-0">
        <span className="block text-[10px] uppercase tracking-[0.03em] text-[var(--text-muted)] mb-0.5">
          {label}
        </span>
        <span className="block text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
          {value}
        </span>
      </span>
    </div>
  );
}

export function DashboardMetricsPills({
  readingSeconds,
  streak,
  loading = false,
}: {
  readingSeconds: number;
  streak: number;
  loading?: boolean;
}) {
  if (loading) return <DashboardMetricsSkeleton />;

  return (
    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
      <MetricPill
        icon={<Clock className="w-4 h-4" strokeWidth={1.8} />}
        label="Reading today"
        value={formatReadingToday(readingSeconds)}
      />
      <MetricPill
        icon={<Flame className="w-4 h-4" strokeWidth={1.8} />}
        label="Streak"
        value={`${streak} ${streak === 1 ? "day" : "days"}`}
      />
    </div>
  );
}
