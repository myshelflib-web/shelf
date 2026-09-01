"use client";

import { AlertTriangle, Cpu, HardDrive } from "lucide-react";
import type { ContentGenOverview } from "@/types";
import { formatBytes, formatPaise } from "./contentGenFormat";

export function ProviderSummary({
  overview,
  loading,
}: {
  overview: ContentGenOverview | null;
  loading: boolean;
}) {
  if (!overview) {
    return (
      <div className="h-28 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 animate-pulse" />
    );
  }

  const { provider } = overview;
  const perPageInr = overview.perPageCostPaise / 100;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-2">
          <Cpu className="w-4 h-4 mt-0.5 text-[var(--text-muted)]" />
          <div>
            <p className="text-sm font-medium">{provider.model}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              ₹{provider.inputInrPerMtok}/1M in · ₹{provider.outputInrPerMtok}/1M
              out
              {loading ? " · refreshing" : ""}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xl">
              Pipeline: syllabus leaf → draft → coverage / fact / filler recheck →
              revise → publish. Pauses if the model API goes down and resumes
              when it is back.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-[var(--text-muted)]">
          <div>
            <p className="uppercase tracking-wide text-[10px]">Catalog</p>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              {overview.totalPages.toLocaleString()} pages
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[10px]">Per page</p>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              ₹{perPageInr.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-wide text-[10px]">Generate all</p>
            <p className="text-sm text-[var(--text-secondary)] font-medium">
              {formatPaise(overview.estimatedCostPaise)}
            </p>
          </div>
          <div className="flex items-start gap-1.5">
            <HardDrive className="w-3 h-3 mt-1 shrink-0" />
            <div>
              <p className="uppercase tracking-wide text-[10px]">S3 if all published</p>
              <p className="text-sm text-[var(--text-secondary)] font-medium">
                {formatBytes(overview.estimatedBytes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!provider.configured && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-500">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            SARVAM_API_KEY is not set, so runs fall back to the default Shelf
            model. Set the key on the backend to generate with Sarvam.
          </span>
        </div>
      )}
    </section>
  );
}
