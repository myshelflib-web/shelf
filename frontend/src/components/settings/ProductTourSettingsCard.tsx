"use client";

import { Compass } from "lucide-react";
import { useProductTour } from "@/hooks/useProductTour";

export function ProductTourSettingsCard() {
  const { resetAndStart } = useProductTour();

  return (
    <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]">
          <Compass className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Product tour</h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            Replay the skippable tips that explain Library, Dashboard, Planner,
            Study AI, and Reader controls. You can also append{" "}
            <code className="text-[var(--text-secondary)]">?tour=1</code> to
            any of those pages.
          </p>
          <button
            type="button"
            onClick={() => resetAndStart("all")}
            className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)]/40"
          >
            Replay tour
          </button>
        </div>
      </div>
    </section>
  );
}
