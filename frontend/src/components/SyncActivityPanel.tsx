"use client";

import { Loader2, Upload, AlertCircle, Cloud } from "lucide-react";
import type { SyncActivityItem } from "@/lib/syncActivityStore";
import { activityStatusLabel } from "@/lib/syncActivityStore";

function RowIcon({ item }: { item: SyncActivityItem }) {
  if (item.status === "error") {
    return <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />;
  }
  if (item.status === "done") {
    return <Cloud className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />;
  }
  if (item.kind === "upload" || item.kind === "retry") {
    if (item.status === "uploading" || item.status === "preparing" || item.status === "finalizing") {
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
  return (
    <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[18.5rem] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden">
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
