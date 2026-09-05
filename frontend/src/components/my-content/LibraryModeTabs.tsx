"use client";

import clsx from "clsx";
import { LibraryMode } from "@/lib/libraryMode";

interface LibraryModeTabsProps {
  mode: LibraryMode;
  onChange: (mode: LibraryMode) => void;
  showPreloaded: boolean;
  className?: string;
}

export function LibraryModeTabs({
  mode,
  onChange,
  showPreloaded,
  className,
}: LibraryModeTabsProps) {
  if (!showPreloaded) return null;

  return (
    <div
      className={clsx(
        "flex items-center gap-0.5 p-0.5 rounded-[10px] bg-[var(--bg-primary)] border border-[var(--border)]",
        className
      )}
      role="tablist"
      aria-label="Library source"
    >
      {(
        [
          { id: "personal" as const, label: "Personal" },
          { id: "preloaded" as const, label: "Preloaded" },
        ] as const
      ).map((tab) => {
        const active = mode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex-1 inline-flex items-center justify-center h-7 px-2.5 rounded-[8px] text-[12px] font-medium leading-none transition",
              active
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
