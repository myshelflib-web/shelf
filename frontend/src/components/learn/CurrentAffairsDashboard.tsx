"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Link2, Newspaper, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { CurrentAffairsItem, StudyGoal } from "@/types";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { useAuth } from "@/hooks/useAuth";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

const GOAL_OPTIONS: StudyGoal[] = [
  "UPSC",
  "STATE_PCS",
  "JUDICIARY",
  "CA",
  "NEET_PG",
  "GATE",
];

function formatWhen(item: CurrentAffairsItem): string {
  const raw = item.publishedAtShelf ?? item.publishedAt;
  if (!raw) return "";
  return new Date(raw).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CurrentAffairsDashboard() {
  const { user } = useAuth();
  const defaultGoal =
    user?.studyGoal && user.studyGoal !== "GENERAL" ? user.studyGoal : "UPSC";
  const [goal, setGoal] = useState<StudyGoal>(defaultGoal);
  const [items, setItems] = useState<CurrentAffairsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.currentAffairs.list({ goal, limit: 50 });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load current affairs");
    } finally {
      setLoading(false);
    }
  }, [goal]);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, CurrentAffairsItem[]>();
    for (const item of items) {
      const key = formatWhen(item) || "Recent";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [items]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 md:px-8 pt-6 pb-4 border-b border-[var(--border)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Newspaper className="w-6 h-6 text-[var(--accent)]" />
              Current affairs
            </h1>
            <p className="page-subtitle mt-1 max-w-2xl">
              Copyright-safe digest from government press and official exam sources.
              Shelf shows summaries and links — open the source for full text.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShelfSelect
              value={goal}
              onChange={(v) => setGoal(v as StudyGoal)}
              options={GOAL_OPTIONS.map((g) => ({
                value: g,
                label: STUDY_GOAL_LABELS[g],
              }))}
              aria-label="Exam track"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--bg-secondary)]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
        {error && (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        )}
        {!loading && items.length === 0 && !error && (
          <div className="rounded-[10px] border border-dashed border-[var(--border)] p-8 text-center text-[var(--text-muted)]">
            No items yet for {STUDY_GOAL_LABELS[goal]}. Admin can seed sources and run
            ingestion from the dashboard.
          </div>
        )}

        <div className="space-y-8 max-w-3xl">
          {grouped.map(([day, dayItems]) => (
            <section key={day}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                {day}
              </h2>
              <ul className="space-y-3">
                {dayItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={item.sharePath ?? `/learn/current-affairs/${item.slug}`}
                          className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          {item.source.name}
                          {item.edition ? ` · ${item.edition}` : ""}
                          {item.linkStatus === "BROKEN" ? " · source unavailable" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <a
                          href={item.canonicalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline inline-flex items-center gap-1 text-xs"
                        >
                          Source
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <Link
                          href={item.sharePath ?? `/learn/current-affairs/${item.slug}`}
                          className="text-[var(--text-muted)] hover:text-[var(--accent)] inline-flex items-center gap-1 text-[11px]"
                        >
                          <Link2 className="w-3 h-3" />
                          Cite & share
                        </Link>
                      </div>
                    </div>
                    {item.shelfSummary && (
                      <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                        {item.shelfSummary}
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--text-muted)] mt-3 italic">
                      {item.disclaimer}
                    </p>
                    {item.learnPath ? (
                      <Link
                        href={item.learnPath}
                        className="inline-block mt-2 text-xs text-[var(--accent)] hover:underline"
                      >
                        Also in Learn catalog →
                      </Link>
                    ) : item.articleId ? (
                      <Link
                        href="/learn"
                        className="inline-block mt-2 text-xs text-[var(--accent)] hover:underline"
                      >
                        Also in Learn catalog →
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
