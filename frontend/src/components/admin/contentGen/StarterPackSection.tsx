"use client";

import { useState } from "react";
import { BookOpen, Loader2, Sparkles } from "lucide-react";
import type { ContentGenPack, StudyGoal } from "@/types";

export type StarterPackRunOptions = {
  studyGoal: StudyGoal;
  subjectSlug?: string;
  limit?: number;
  dryRun: boolean;
  skipExisting: boolean;
};

export function StarterPackSection({
  packs,
  loading,
  busyGoal,
  disabled,
  onRun,
}: {
  packs: ContentGenPack[];
  loading: boolean;
  busyGoal: StudyGoal | null;
  disabled: boolean;
  onRun: (opts: StarterPackRunOptions) => void;
}) {
  const [dryRun, setDryRun] = useState(true);
  const [skipExisting, setSkipExisting] = useState(true);
  const [limit, setLimit] = useState("");

  const parsedLimit = Number(limit) > 0 ? Number(limit) : undefined;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold">Syllabus library</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xl">
            Organised exam → paper → subject → topic → page. Generate a whole
            goal or one subject. Each page is drafted against a checklist, then
            audited for coverage, factual risk and filler. Dry-run first to see
            scores without publishing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Dry run
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={skipExisting}
              onChange={(e) => setSkipExisting(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Skip published
          </label>
          <label className="inline-flex items-center gap-1.5">
            Limit
            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
              placeholder="all"
              inputMode="numeric"
              className="w-16 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1"
            />
          </label>
        </div>
      </div>

      {loading && packs.length === 0 ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {packs.map((pack) => (
            <div
              key={pack.studyGoal}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    {pack.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {pack.articleCount} pages across {pack.subjects.length}{" "}
                    subjects
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pack.subjects.map((subject) => (
                      <button
                        key={subject.slug}
                        type="button"
                        title={`Generate ${subject.name} only`}
                        disabled={disabled || busyGoal !== null}
                        onClick={() =>
                          onRun({
                            studyGoal: pack.studyGoal,
                            subjectSlug: subject.slug,
                            limit: parsedLimit,
                            dryRun,
                            skipExisting,
                          })
                        }
                        className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text-secondary)] transition disabled:opacity-50"
                      >
                        {subject.name}
                        <span className="ml-1 opacity-60">
                          {subject.articleCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={disabled || busyGoal !== null}
                  onClick={() =>
                    onRun({
                      studyGoal: pack.studyGoal,
                      limit: parsedLimit,
                      dryRun,
                      skipExisting,
                    })
                  }
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs hover:border-[var(--accent)]/40 transition disabled:opacity-50"
                >
                  {busyGoal === pack.studyGoal ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  All subjects
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
