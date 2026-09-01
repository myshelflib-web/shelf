"use client";

import { useState } from "react";
import { AlertTriangle, Database, Loader2, RefreshCw } from "lucide-react";
import type { IngestSourceRow } from "@/types";

function formatPollTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function IngestSourcesSection({
  sources,
  loading,
  seedBusy,
  refreshBusy,
  pollBusyId,
  onSeed,
  onRefresh,
  onPoll,
}: {
  sources: IngestSourceRow[];
  loading: boolean;
  seedBusy: boolean;
  refreshBusy: boolean;
  pollBusyId: string | null;
  onSeed: () => void;
  onRefresh: () => void;
  onPoll: (sourceId: string) => void;
}) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  function toggleError(id: string) {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-semibold">Sources</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Official RSS and document watchers for current affairs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={seedBusy}
            onClick={onSeed}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm hover:border-[var(--accent)]/40 transition disabled:opacity-60"
          >
            {seedBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Seed sources
          </button>
          <button
            type="button"
            disabled={refreshBusy}
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm hover:border-[var(--accent)]/40 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshBusy ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && sources.length === 0 ? (
        <ul className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <li
              key={i}
              className="h-14 rounded-lg bg-[var(--bg-secondary)] animate-pulse"
              aria-hidden
            />
          ))}
        </ul>
      ) : sources.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          No sources yet. Seed defaults to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {sources.map((source) => {
            const pollBusy = pollBusyId === source.id;
            const lastPoll = formatPollTime(source.lastPolledAt);
            const showError = Boolean(source.lastError);
            const errorOpen = expandedErrors.has(source.id);

            return (
              <li
                key={source.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-sm">{source.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {source.cadence.toLowerCase()} · {source._count.items} items
                      </span>
                      {showError ? (
                        <button
                          type="button"
                          onClick={() => toggleError(source.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.6875rem] font-medium text-amber-500 hover:bg-amber-500/15"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {errorOpen ? "Hide poll note" : "Last poll issue"}
                        </button>
                      ) : null}
                    </div>
                    {lastPoll ? (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Last polled {lastPoll}
                      </p>
                    ) : null}
                    {showError && errorOpen ? (
                      <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                        {source.lastError}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={pollBusy}
                    onClick={() => onPoll(source.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:underline disabled:opacity-60 shrink-0"
                  >
                    {pollBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Poll now
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
