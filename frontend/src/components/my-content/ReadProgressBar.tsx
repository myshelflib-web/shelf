"use client";

import clsx from "clsx";

/** Compact reading progress track + percentage label. */
export function ReadProgressBar({
  percent,
  className,
  trackClassName,
}: {
  percent: number;
  className?: string;
  trackClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 min-w-[6.5rem] max-w-[11rem] w-full",
        className
      )}
      aria-label={`Reading progress ${percent}%`}
    >
      <div
        className={clsx(
          "flex-1 h-1.5 min-w-[4.5rem] rounded-full bg-[var(--border)] overflow-hidden",
          trackClassName
        )}
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-150"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-[var(--text-muted)] w-7 shrink-0 text-right">
        {percent}%
      </span>
    </div>
  );
}
