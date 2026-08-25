"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";

function pageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    set.add(2);
    set.add(3);
    set.add(4);
  }
  if (current >= total - 2) {
    set.add(total - 1);
    set.add(total - 2);
    set.add(total - 3);
  }
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const n of nums) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

export function NotebookPager({
  page,
  totalPages,
  total,
  onPage,
  disabled,
  noun = "collection",
  compact = false,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  disabled?: boolean;
  noun?: string;
  compact?: boolean;
  className?: string;
}) {
  if (total === 0) return null;
  const items = pageWindow(page, totalPages);
  const plural = total === 1 ? noun : `${noun}s`;

  return (
    <div
      className={clsx(
        "flex items-center gap-1 shrink-0",
        compact ? "justify-center" : "justify-between gap-3 pt-3",
        className
      )}
    >
      {!compact && (
        <p className="text-xs text-[var(--text-muted)]">
          {total} {plural}
        </p>
      )}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={disabled || page <= 1}
          onClick={() => onPage(page - 1)}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {items.map((item, i) =>
          item === "…" ? (
            <span key={`e${i}`} className="px-1 text-[var(--text-muted)] text-sm">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              disabled={disabled}
              onClick={() => onPage(item)}
              className={clsx(
                "rounded-lg transition-colors",
                compact
                  ? "min-w-7 h-7 px-1.5 text-xs"
                  : "min-w-8 h-8 px-2 text-sm",
                item === page
                  ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              )}
            >
              {item}
            </button>
          )
        )}
        <button
          type="button"
          disabled={disabled || page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
