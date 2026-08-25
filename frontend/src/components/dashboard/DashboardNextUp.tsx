"use client";

import Link from "next/link";
import { DashboardNextUpSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { StudyTask } from "@/types";
import {
  calendarDateKey,
  formatNextUpWhen,
  nextUpBucket,
} from "@/lib/dashboardNextUp";

export function DashboardNextUp({
  items,
  remaining,
  loading = false,
}: {
  items: StudyTask[];
  remaining: number;
  loading?: boolean;
}) {
  if (loading) return <DashboardNextUpSkeleton />;
  const calendarLabel =
    remaining > 0 ? `View planner · ${remaining} more →` : "View planner →";

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight">Next up</h2>
        <Link
          href="/planner"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] whitespace-nowrap"
        >
          {calendarLabel}
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold mb-1">No plans yet</p>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              Your next task or scheduled study block will appear here.
            </p>
          </div>
          <Link
            href="/planner"
            className="shrink-0 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-semibold hover:border-[var(--accent)]/40"
          >
            Plan first task →
          </Link>
        </div>
      ) : (
        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
          {items.map((task) => {
            if (!task.dueAt) return null;
            const dueAt = task.dueAt;
            const overdue = nextUpBucket(dueAt) === "overdue";
            return (
              <Link
                key={task.id}
                href={`/planner?date=${calendarDateKey(dueAt)}&edit=${encodeURIComponent(task.id)}`}
                className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[8rem_1fr_auto] items-center gap-3.5 px-4 py-3.5 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-secondary)]"
              >
                <span
                  className={`text-[11.5px] ${
                    overdue ? "text-red-400" : "text-[var(--text-muted)]"
                  }`}
                >
                  {formatNextUpWhen(dueAt)}
                </span>
                <span className="text-[13px] font-semibold truncate">
                  {task.title}
                </span>
                {overdue ? (
                  <span className="hidden sm:inline text-[10px] text-red-400 border border-red-400/25 rounded-full px-2 py-0.5">
                    Overdue
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
