"use client";

import Link from "next/link";
import { Check, Loader2, Upload, X } from "lucide-react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import type { IngestItemRow } from "@/types";

export function IngestReviewQueue({
  items,
  loading,
  statusFilter,
  selectedIds,
  allPendingSelected,
  busyId,
  onStatusFilterChange,
  onToggleSelected,
  onToggleSelectAllPending,
  onApprove,
  onReject,
  onRetryPublish,
  onBulkApproveSelected,
  onBulkApproveAll,
}: {
  items: IngestItemRow[];
  loading: boolean;
  statusFilter: string;
  selectedIds: Set<string>;
  allPendingSelected: boolean;
  busyId: string | null;
  onStatusFilterChange: (value: string) => void;
  onToggleSelected: (id: string) => void;
  onToggleSelectAllPending: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRetryPublish: (id: string) => void;
  onBulkApproveSelected: () => void;
  onBulkApproveAll: () => void;
}) {
  const pendingItems = items.filter((item) => item.status === "PENDING_REVIEW");
  const showBulk = statusFilter === "PENDING_REVIEW" && pendingItems.length > 0;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div>
          <h2 className="text-sm font-semibold">Review queue</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Approve summaries before they appear on Learn.
          </p>
        </div>
        <ShelfSelect
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { value: "PENDING_REVIEW", label: "Pending review" },
            { value: "APPROVED", label: "Approved" },
            { value: "PUBLISHED", label: "Published" },
            { value: "REJECTED", label: "Rejected" },
          ]}
          aria-label="Queue filter"
          className="ml-auto"
        />
        {showBulk ? (
          <>
            <button
              type="button"
              disabled={busyId !== null || selectedIds.size === 0}
              onClick={onBulkApproveSelected}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 text-white px-2.5 py-1 text-xs disabled:opacity-60"
            >
              {busyId === "bulk-approve-selected" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Approve selected ({selectedIds.size})
            </button>
            <button
              type="button"
              disabled={busyId !== null}
              onClick={onBulkApproveAll}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 text-emerald-400 px-2.5 py-1 text-xs disabled:opacity-60"
            >
              {busyId === "bulk-approve-all" ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              Approve all pending
            </button>
          </>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <li
              key={i}
              className="h-24 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] animate-pulse"
              aria-hidden
            />
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {showBulk ? (
            <li className="flex items-center gap-2 px-1 text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={allPendingSelected}
                onChange={onToggleSelectAllPending}
                className="rounded border-[var(--border)]"
                aria-label="Select all pending items"
              />
              Select all pending in view
            </li>
          ) : null}

          {items.map((item) => {
            const itemBusy = busyId === item.id || busyId === `promote-${item.id}`;
            const canRetryPublish =
              item.status === "APPROVED" && item.article?.status !== "PUBLISHED";

            return (
              <li
                key={item.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  {item.status === "PENDING_REVIEW" ? (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelected(item.id)}
                      className="mt-1 rounded border-[var(--border)] shrink-0"
                      aria-label={`Select ${item.title}`}
                    />
                  ) : (
                    <span className="w-4 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {item.source.name} · {item.status.replaceAll("_", " ").toLowerCase()}
                    </p>
                    {item.shelfSummary ? (
                      <p className="text-[var(--text-secondary)] mt-2 text-xs leading-relaxed line-clamp-4">
                        {item.shelfSummary}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.status === "PENDING_REVIEW" ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => onApprove(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 text-white px-2.5 py-1 text-xs disabled:opacity-60"
                          >
                            {busyId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => onReject(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs disabled:opacity-60"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </>
                      ) : null}
                      {canRetryPublish ? (
                        <button
                          type="button"
                          disabled={busyId === `promote-${item.id}`}
                          onClick={() => onRetryPublish(item.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs disabled:opacity-60"
                        >
                          {busyId === `promote-${item.id}` ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                          Retry publish
                        </button>
                      ) : null}
                      {item.status === "PUBLISHED" || item.article ? (
                        <Link
                          href={`/learn/current-affairs/${item.slug}`}
                          className="text-xs text-[var(--accent)] hover:underline self-center"
                        >
                          Public page
                        </Link>
                      ) : null}
                      <a
                        href={item.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--accent)] hover:underline self-center"
                      >
                        Source
                      </a>
                    </div>
                  </div>
                  {itemBusy ? (
                    <Loader2
                      className="w-4 h-4 animate-spin text-[var(--text-muted)] shrink-0 mt-1"
                      aria-hidden
                    />
                  ) : null}
                </div>
              </li>
            );
          })}

          {items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No items in this queue.</p>
          ) : null}
        </ul>
      )}
    </section>
  );
}
