"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import type { ContentGenPack, StudyGoal } from "@/types";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export type VisualEnrichRunOptions = {
  studyGoal: StudyGoal;
  subjectSlug?: string;
  limit?: number;
  dryRun: boolean;
};

export function VisualEnrichSection({
  packs,
  loading,
  running,
  disabled,
  lockReason,
  onRun,
}: {
  packs: ContentGenPack[];
  loading: boolean;
  running: boolean;
  disabled: boolean;
  lockReason: string | null;
  onRun: (opts: VisualEnrichRunOptions) => void;
}) {
  const [studyGoal, setStudyGoal] = useState<StudyGoal>("UPSC");
  const [subjectSlug, setSubjectSlug] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [limit, setLimit] = useState("10");

  const pack = packs.find((p) => p.studyGoal === studyGoal);
  const parsedLimit = Number(limit) > 0 ? Number(limit) : undefined;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            Add photos to published pages
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xl">
            Phase 2 — does not rewrite text. Searches Openverse for CC-licensed
            photos (one per page), stores them in S3, and injects a credited
            figure. Dry-run first. Mind maps and AI images come in a later phase
            (see docs/CONTENT_GEN_VISUALS.md).
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
          <label className="inline-flex items-center gap-1.5">
            Limit
            <input
              value={limit}
              onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
              placeholder="10"
              inputMode="numeric"
              className="w-16 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1"
            />
          </label>
        </div>
      </div>

      {lockReason && (
        <p className="mb-3 rounded-lg border border-sky-500/25 bg-sky-500/5 px-3 py-2 text-xs text-sky-300">
          {lockReason}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-[var(--text-muted)]">Study goal</span>
          <ShelfSelect
            value={studyGoal}
            onChange={(value) => {
              setStudyGoal(value as StudyGoal);
              setSubjectSlug("");
            }}
            options={packs.map((p) => ({ value: p.studyGoal, label: p.label }))}
            compact
            disabled={loading}
            aria-label="Study goal"
          />
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <span className="text-[var(--text-muted)]">Subject (optional)</span>
          <ShelfSelect
            value={subjectSlug}
            onChange={setSubjectSlug}
            options={[
              { value: "", label: "All subjects with live pages" },
              ...(pack?.subjects.map((s) => ({ value: s.slug, label: s.name })) ??
                []),
            ]}
            compact
            disabled={loading || !pack}
            aria-label="Subject"
          />
        </div>
        <button
          type="button"
          disabled={disabled || running || loading}
          onClick={() =>
            onRun({
              studyGoal,
              subjectSlug: subjectSlug || undefined,
              limit: parsedLimit,
              dryRun,
            })
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs hover:border-[var(--accent)]/40 transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          Enrich visuals
        </button>
      </div>
    </section>
  );
}
