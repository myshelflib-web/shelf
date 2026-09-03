"use client";

import { Loader2 } from "lucide-react";
import { useDeleteProgress } from "@/hooks/useDeleteProgress";

/** Fixed, non-blocking delete progress — does not lock the UI. */
export function DeleteProgressBar() {
  const jobs = useDeleteProgress();
  if (jobs.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 px-3 w-full max-w-md"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-1.5">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="pointer-events-none flex items-center gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg px-3 py-2.5"
          >
            <Loader2
              className="w-4 h-4 shrink-0 animate-spin text-[var(--accent)]"
              aria-hidden
            />
            <p className="text-sm text-[var(--text-secondary)] min-w-0 flex-1 truncate">
              {job.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
