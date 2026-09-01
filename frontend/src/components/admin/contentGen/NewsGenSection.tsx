"use client";

import { useState } from "react";
import { Loader2, Newspaper, Search, Sparkles } from "lucide-react";
import type { ContentGenNewsCluster, StudyGoal } from "@/types";
import { STUDY_GOAL_OPTIONS } from "@/lib/studyGoal";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export type NewsRunOptions = {
  studyGoal: StudyGoal;
  limit: number;
  windowDays: number;
  minSources: number;
  dryRun: boolean;
};

const fieldClass =
  "rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs";

export function NewsGenSection({
  clusters,
  planning,
  running,
  disabled,
  onPlan,
  onRun,
}: {
  clusters: ContentGenNewsCluster[] | null;
  planning: boolean;
  running: boolean;
  disabled: boolean;
  onPlan: (opts: NewsRunOptions) => void;
  onRun: (opts: NewsRunOptions) => void;
}) {
  const [studyGoal, setStudyGoal] = useState<StudyGoal>("UPSC");
  const [limit, setLimit] = useState(8);
  const [windowDays, setWindowDays] = useState(7);
  const [minSources, setMinSources] = useState(2);
  const [dryRun, setDryRun] = useState(true);

  const opts: NewsRunOptions = { studyGoal, limit, windowDays, minSources, dryRun };

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Newspaper className="w-4 h-4 text-[var(--text-muted)]" />
          Current affairs briefs
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl">
          Groups already-scraped items into stories covered by multiple
          publishers, then writes an original brief from the shared facts. Briefs
          are audited for unsupported claims and copied phrasing before publishing,
          and every source is credited and linked.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-xs mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">Exam</span>
          <ShelfSelect
            value={studyGoal}
            onChange={(value) => setStudyGoal(value as StudyGoal)}
            options={STUDY_GOAL_OPTIONS.map(([value, label]) => ({
              value,
              label,
            }))}
            compact
            aria-label="Exam"
          />
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">Briefs</span>
          <input
            type="number"
            min={1}
            max={25}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value) || 1)}
            className={`${fieldClass} w-16`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">Look back (days)</span>
          <input
            type="number"
            min={1}
            max={60}
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value) || 1)}
            className={`${fieldClass} w-20`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[var(--text-muted)]">Min sources</span>
          <input
            type="number"
            min={1}
            max={5}
            value={minSources}
            onChange={(e) => setMinSources(Number(e.target.value) || 1)}
            className={`${fieldClass} w-16`}
          />
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer pb-1.5">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Dry run
        </label>

        <button
          type="button"
          disabled={planning}
          onClick={() => onPlan(opts)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 hover:border-[var(--accent)]/40 transition disabled:opacity-50"
        >
          {planning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          Preview stories
        </button>
        <button
          type="button"
          disabled={disabled || running}
          onClick={() => onRun(opts)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 hover:border-[var(--accent)]/40 transition disabled:opacity-50"
        >
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Generate briefs
        </button>
      </div>

      {clusters !== null && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] divide-y divide-[var(--border)]">
          {clusters.length === 0 ? (
            <p className="p-3 text-xs text-[var(--text-muted)]">
              No multi-source stories in this window. Poll the ingestion sources,
              widen the look-back, or lower the minimum source count.
            </p>
          ) : (
            clusters.map((cluster) => (
              <div key={cluster.key} className="p-3">
                <p className="text-xs font-medium">{cluster.leadTitle}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {cluster.sourceCount} sources · {cluster.sources.join(", ")}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
