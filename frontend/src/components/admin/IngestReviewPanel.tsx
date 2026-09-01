"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { IngestItemRow, IngestJobRow, IngestSourceRow } from "@/types";
import { RefreshCw, Check, X, Upload, Database } from "lucide-react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

export function IngestReviewPanel() {
  const [sources, setSources] = useState<IngestSourceRow[]>([]);
  const [items, setItems] = useState<IngestItemRow[]>([]);
  const [jobs, setJobs] = useState<IngestJobRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING_REVIEW");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [src, it, jb] = await Promise.all([
      api.admin.ingestSources(),
      api.admin.ingestItems({ status: statusFilter, limit: 50 }),
      api.admin.ingestJobs(20),
    ]);
    setSources(src.sources);
    setItems(it.items);
    setJobs(jb.jobs);
  }, [statusFilter]);

  useEffect(() => {
    void refresh().catch(() => setMessage("Failed to load ingest data"));
  }, [refresh]);

  async function run(action: () => Promise<unknown>, id: string) {
    setBusy(id);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Content ingestion</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Copyright-safe pipeline: gov RSS, official PDF watchers, admin review, SQS workers.
        </p>
      </div>

      {message && (
        <p className="text-sm text-red-400 rounded-[10px] border border-red-500/30 px-3 py-2">
          {message}
        </p>
      )}

      <section className="rounded-[10px] border border-[var(--border)] p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run(() => api.admin.preloadedSeedCatalog(), "preloaded-seed")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <Database className="w-4 h-4" />
            Seed preloaded catalog
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              void run(() => api.admin.preloadedMigrateLinks(), "preloaded-migrate")
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            Clear S3 pointers
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              void run(() => api.admin.preloadedCheckLinks(20), "preloaded-check")
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            Check preloaded links
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run(() => api.admin.ingestSeedSources(), "seed")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] text-white px-3 py-2 text-sm"
          >
            <Database className="w-4 h-4" />
            Seed default sources
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        <h2 className="text-sm font-semibold mb-2">Sources</h2>
        <ul className="space-y-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{s.name}</span>
                <span className="text-[var(--text-muted)] ml-2">
                  {s.cadence} · {s.license} · {s._count.items} items
                </span>
                {s.lastError && (
                  <p className="text-xs text-red-400 mt-0.5">{s.lastError}</p>
                )}
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void run(() => api.admin.ingestPollSource(s.id), s.id)}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Poll now → SQS
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold">Review queue</h2>
          <ShelfSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "PENDING_REVIEW", label: "Pending review" },
              { value: "FETCHED", label: "Fetched" },
              { value: "APPROVED", label: "Approved" },
              { value: "PUBLISHED", label: "Published" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            aria-label="Queue filter"
          />
        </div>

        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-[var(--border)] p-3 text-sm"
            >
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {item.source.name} · {item.status} · {item.license}
                {item.linkStatus && item.linkStatus !== "UNKNOWN"
                  ? ` · link ${item.linkStatus.toLowerCase()}`
                  : ""}
              </p>
              {item.shelfSummary && (
                <p className="text-[var(--text-secondary)] mt-2 text-xs leading-relaxed">
                  {item.shelfSummary}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {item.status === "PENDING_REVIEW" && (
                  <>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(() => api.admin.ingestApproveItem(item.id), item.id)
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/90 text-white px-2.5 py-1 text-xs"
                    >
                      <Check className="w-3 h-3" /> Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() =>
                        void run(() => api.admin.ingestRejectItem(item.id), item.id)
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs"
                    >
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(() => api.admin.ingestPromoteItem(item.id), `promote-${item.id}`)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs"
                >
                  <Upload className="w-3 h-3" /> Promote to Learn
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(() => api.admin.ingestCheckLink(item.id), `link-${item.id}`)
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs"
                >
                  Check link
                </button>
                <Link
                  href={`/learn/current-affairs/${item.slug}`}
                  className="text-xs text-[var(--accent)] hover:underline self-center"
                >
                  Public page
                </Link>
                <a
                  href={item.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline self-center"
                >
                  Source link
                </a>
              </div>
            </li>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-[var(--text-muted)]">No items in this queue.</p>
          )}
        </ul>
      </section>

      <section className="rounded-[10px] border border-[var(--border)] p-4">
        <h2 className="text-sm font-semibold mb-2">Recent jobs</h2>
        <ul className="text-xs space-y-1 font-mono text-[var(--text-muted)]">
          {jobs.map((j) => (
            <li key={j.id}>
              {j.phase} · {j.status}
              {j.source ? ` · ${j.source.slug}` : ""}
              {j.error ? ` · ${j.error}` : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
