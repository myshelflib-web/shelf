"use client";

import clsx from "clsx";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  PauseCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Square,
} from "lucide-react";
import type { ContentGenItemRow, ContentGenJobRow } from "@/types";
import {
  CONTENT_GEN_STATUS_STYLES,
  formatPaise,
  formatTime,
  formatTokens,
} from "./contentGenFormat";

function ItemRows({
  items,
  loading,
  hasMore,
  onLoadMore,
}: {
  items: ContentGenItemRow[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <div className="border-t border-[var(--border)] divide-y divide-[var(--border)]">
      {items.length === 0 && !loading && (
        <p className="px-3 py-2 text-[11px] text-[var(--text-muted)]">
          No page rows yet — they appear as each page starts generating.
        </p>
      )}
      {items.map((item) => (
        <div key={item.id} className="px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{item.title}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                {item.subjectSlug}/{item.topicSlug}/{item.slug}
                {item.wordCount > 0 ? ` · ${item.wordCount} words` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {item.hasDraft && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  draft kept
                </span>
              )}
              {item.relevanceScore !== null && (
                <span className="text-[11px] text-[var(--text-muted)]">
                  score {item.relevanceScore}
                </span>
              )}
              <span
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  CONTENT_GEN_STATUS_STYLES[item.status]
                )}
              >
                {item.status}
              </span>
            </div>
          </div>
          {item.error && (
            <p className="text-[11px] text-red-400 mt-1">{item.error}</p>
          )}
          {item.reviewNotes && (
            <p className="text-[11px] text-[var(--text-muted)] mt-1 whitespace-pre-line">
              {item.reviewNotes}
            </p>
          )}
        </div>
      ))}
      {hasMore && (
        <div className="px-3 py-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loading}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-50"
          >
            {loading ? "Loading…" : "Load older pages"}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A paused run is waiting on the provider, not stuck — the backend keeps
 * probing and restarts itself. The button is there for an impatient retry.
 */
function PausedBanner({
  job,
  resuming,
  stopping,
  onResume,
  onStop,
}: {
  job: ContentGenJobRow;
  resuming: boolean;
  stopping: boolean;
  onResume: () => void;
  onStop: () => void;
}) {
  const remaining =
    job.plannedCount -
    (job.completedCount + job.failedCount + job.skippedCount);
  const busy = resuming || stopping;

  return (
    <div className="mx-3 mb-2.5 rounded-lg border border-sky-500/25 bg-sky-500/5 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-sky-300 flex items-center gap-1.5">
            <PauseCircle className="w-3.5 h-3.5" />
            Paused — waiting for the model API to come back
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {remaining} page{remaining === 1 ? "" : "s"} left. Shelf retries on its
            own with a growing delay and picks up where it stopped.
            {job.pausedReason ? ` Last error: ${job.pausedReason}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={onResume}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] hover:border-[var(--accent)]/40 transition disabled:opacity-50"
          >
            {resuming ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            Resume now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-[11px] text-red-300 hover:border-red-500/50 transition disabled:opacity-50"
          >
            {stopping ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Square className="w-3 h-3" />
            )}
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveBanner({
  job,
  stopping,
  onStop,
}: {
  job: ContentGenJobRow;
  stopping: boolean;
  onStop: () => void;
}) {
  const remaining =
    job.plannedCount -
    (job.completedCount + job.failedCount + job.skippedCount);

  return (
    <div className="mx-3 mb-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/60 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium">
            {job.status === "QUEUED"
              ? "Queued"
              : remaining === 0
                ? "Finishing"
                : "Generating"}{" "}
            — {remaining} page
            {remaining === 1 ? "" : "s"} left
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {remaining === 0
              ? "Every page is scored. The run should close on its own — Stop will mark it finished if it is stuck."
              : "Stop aborts the model call in progress. Pages already published stay. In-flight pages are skipped so Retry failed can pick them up."}
          </p>
        </div>
        <button
          type="button"
          disabled={stopping}
          onClick={onStop}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1 text-[11px] text-red-300 hover:border-red-500/50 transition disabled:opacity-50"
        >
          {stopping ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Square className="w-3 h-3" />
          )}
          Stop
        </button>
      </div>
    </div>
  );
}

function FailedBanner({
  job,
  retrying,
  disabled,
  onRetry,
}: {
  job: ContentGenJobRow;
  retrying: boolean;
  disabled: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="mx-3 mb-2.5 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-amber-300">
            {[
              job.failedCount > 0
                ? `${job.failedCount} failed`
                : null,
              job.skippedCount > 0
                ? `${job.skippedCount} held below score`
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Resume will not redo these. Retry revises held pages from the last
            draft when we still have it, then publishes if the score clears 70
            and Dry run is off. Crashes with no draft are written from scratch.
          </p>
        </div>
        <button
          type="button"
          disabled={retrying || disabled}
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] hover:border-[var(--accent)]/40 transition disabled:opacity-50"
        >
          {retrying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RotateCcw className="w-3 h-3" />
          )}
          Retry failed
        </button>
      </div>
    </div>
  );
}

export function ContentGenJobsSection({
  jobs,
  items,
  itemsLoading,
  itemsHasMore,
  loading,
  expandedId,
  resumingId,
  retryingId,
  stoppingId,
  retryDisabled,
  onToggle,
  onLoadMore,
  onRefresh,
  onResume,
  onRetryFailed,
  onStop,
}: {
  jobs: ContentGenJobRow[];
  items: ContentGenItemRow[];
  itemsLoading: boolean;
  itemsHasMore: boolean;
  loading: boolean;
  expandedId: string | null;
  resumingId: string | null;
  retryingId: string | null;
  stoppingId: string | null;
  retryDisabled: boolean;
  onToggle: (jobId: string) => void;
  onLoadMore: () => void;
  onRefresh: () => void;
  onResume: (jobId: string) => void;
  onRetryFailed: (jobId: string) => void;
  onStop: (jobId: string) => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold">Runs</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Live progress, per-page review scores and spend.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs hover:border-[var(--accent)]/40 transition"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          No generation runs yet.
        </p>
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] divide-y divide-[var(--border)]">
          {jobs.map((job) => {
            const expanded = expandedId === job.id;
            const done =
              job.completedCount + job.failedCount + job.skippedCount;
            return (
              <div key={job.id}>
                <button
                  type="button"
                  onClick={() => onToggle(job.id)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-secondary)]/50 transition"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {expanded ? (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">
                          {job.kind === "STARTER_PACK"
                            ? "Starter pack"
                            : "News briefs"}{" "}
                          · {job.studyGoal}
                          {job.dryRun ? " · dry run" : ""}
                          {job.withIllustrations === false ? " · text only" : " · figures"}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {done}/{job.plannedCount} done · {job.model} ·{" "}
                          {formatTime(job.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {formatTokens(job.inputTokens + job.outputTokens)} tok ·{" "}
                        {formatPaise(job.costPaise)}
                      </span>
                      <span
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[11px]",
                          CONTENT_GEN_STATUS_STYLES[job.status]
                        )}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                  {job.error && job.status !== "PAUSED" && (
                    <p className="text-[11px] text-red-400 mt-1 pl-5">
                      {job.error}
                    </p>
                  )}
                </button>
                {job.status === "PAUSED" && (
                  <PausedBanner
                    job={job}
                    resuming={resumingId === job.id}
                    stopping={stoppingId === job.id}
                    onResume={() => onResume(job.id)}
                    onStop={() => onStop(job.id)}
                  />
                )}
                {(job.status === "QUEUED" || job.status === "RUNNING") && (
                  <ActiveBanner
                    job={job}
                    stopping={stoppingId === job.id}
                    onStop={() => onStop(job.id)}
                  />
                )}
                {(job.failedCount > 0 || job.skippedCount > 0) &&
                  job.status !== "QUEUED" &&
                  job.status !== "RUNNING" &&
                  job.status !== "PAUSED" && (
                    <FailedBanner
                      job={job}
                      retrying={retryingId === job.id}
                      disabled={retryDisabled}
                      onRetry={() => onRetryFailed(job.id)}
                    />
                  )}
                {expanded && (
                  <ItemRows
                    items={items}
                    loading={itemsLoading}
                    hasMore={itemsHasMore}
                    onLoadMore={onLoadMore}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
