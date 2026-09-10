"use client";

import { useState } from "react";
import { Loader2, Upload, AlertCircle, Cloud, X, RefreshCw } from "lucide-react";
import type { SyncActivityItem } from "@/lib/syncActivityStore";
import { activityStatusLabel } from "@/lib/syncActivityStore";
import { dismissSyncActivity } from "@/lib/dismissSyncActivity";
import { retryFailedSync } from "@/lib/retryFailedSync";

function RowIcon({ item }: { item: SyncActivityItem }) {
  if (item.status === "error") {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />;
  }
  if (item.status === "done") {
    return <Cloud className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />;
  }
  if (item.kind === "upload" || item.kind === "retry") {
    if (
      item.status === "uploading" ||
      item.status === "preparing" ||
      item.status === "finalizing"
    ) {
      return (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--text-muted)]" />
      );
    }
    return <Upload className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />;
  }
  return (
    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--text-muted)]" />
  );
}

function ProgressBar({ percent }: { percent: number }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SyncActivityPanel({
  items,
  online,
}: {
  items: SyncActivityItem[];
  online: boolean;
}) {
  const [retrying, setRetrying] = useState(false);
  const retryable = items.filter(
    (a) => a.status === "error" || a.status === "pending"
  );
  const showRetry = online && retryable.length > 0;

  return (
    <div className="relative z-[60] w-[18.5rem] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
        <p className="text-sm font-semibold">Sync</p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {online
            ? "Background uploads and pending changes"
            : "You're offline — changes will sync when you're back"}
        </p>
      </div>
      <div className="max-h-[16rem] overflow-y-auto py-1">
        {items.length === 0 ? (
          <p className="px-3.5 py-8 text-center text-[13px] text-[var(--text-muted)]">
            Nothing in progress. All changes are synced.
          </p>
        ) : (
          <ul>
            {items.map((item) => {
              const showBar =
                item.status === "uploading" ||
                item.status === "preparing" ||
                item.status === "finalizing";
              const canDismiss =
                item.status === "error" || item.status === "pending";
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2 px-3.5 py-2.5 border-b border-[var(--border)] last:border-b-0"
                >
                  <span className="mt-0.5">
                    <RowIcon item={item} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] truncate text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <span
                      className={`text-[11px] ${
                        item.status === "error"
                          ? "text-red-400"
                          : "text-[var(--text-muted)]"
                      }`}
                    >
                      {activityStatusLabel(item)}
                    </span>
                    {showBar && item.percent != null ? (
                      <ProgressBar percent={item.percent} />
                    ) : null}
                  </span>
                  {canDismiss ? (
                    <button
                      type="button"
                      className="mt-0.5 rounded p-0.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-secondary)]"
                      title="Dismiss"
                      aria-label={`Dismiss ${item.title}`}
                      onClick={() => {
                        void dismissSyncActivity(item.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {showRetry ? (
        <div className="border-t border-[var(--border)] px-3.5 py-2.5">
          <button
            type="button"
            disabled={retrying}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-60"
            onClick={() => {
              setRetrying(true);
              void retryFailedSync().finally(() => setRetrying(false));
            }}
          >
            {retrying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            )}
            {retrying ? "Retrying…" : "Retry failed"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
