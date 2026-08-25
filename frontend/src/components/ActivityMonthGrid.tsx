"use client";

import clsx from "clsx";
import { localYmd, monthCells } from "@/lib/monthGrid";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivityMonthGrid({
  year,
  month,
  activeDates,
  today,
}: {
  year: number;
  month: number;
  activeDates: Iterable<string>;
  today: string;
}) {
  const cells = monthCells(year, month);
  const active = activeDates instanceof Set ? activeDates : new Set(activeDates);

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {WEEKDAYS.map((d, i) => (
        <span
          key={`${d}-${i}`}
          className="text-[10px] text-[var(--text-muted)] py-0.5"
        >
          {d}
        </span>
      ))}
      {cells.map((day, i) => {
        if (!day) return <span key={`e-${i}`} />;
        const key = localYmd(new Date(year, month, day));
        const isToday = key === today;
        const isActive = active.has(key);
        return (
          <span
            key={key}
            title={
              isActive
                ? `${key} · active`
                : isToday
                  ? `${key} · today`
                  : key
            }
            className={clsx(
              "flex items-center justify-center aspect-square text-[11px] tabular-nums rounded-[8px]",
              isActive
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
              isToday && "ring-1 ring-[var(--accent)]",
              isToday && !isActive && "text-[var(--text-primary)]"
            )}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
}
