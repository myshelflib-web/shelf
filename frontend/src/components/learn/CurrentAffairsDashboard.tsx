"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Newspaper, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { CurrentAffairsItem, StudyGoal } from "@/types";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { useAuth } from "@/hooks/useAuth";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { ExploreWorkspaceShell } from "@/components/learn/explore/ExploreWorkspaceShell";
import { CurrentAffairsItemCard } from "@/components/learn/CurrentAffairsItemCard";
import { CurrentAffairsWorkspace } from "@/components/learn/CurrentAffairsWorkspace";

const GOAL_OPTIONS: StudyGoal[] = [
  "UPSC",
  "STATE_PCS",
  "JUDICIARY",
  "CA",
  "NEET_PG",
  "GATE",
];

function formatDay(item: CurrentAffairsItem): string {
  const raw = item.publishedAtShelf ?? item.publishedAt;
  if (!raw) return "Recent";
  return new Date(raw).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CurrentAffairsDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const defaultGoal =
    user?.studyGoal && user.studyGoal !== "GENERAL" ? user.studyGoal : "UPSC";
  const [goal, setGoal] = useState<StudyGoal>(defaultGoal);
  const [items, setItems] = useState<CurrentAffairsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(0);

  const returnTo = "/learn/current-affairs";

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.source.name.toLowerCase().includes(needle) ||
        (item.shelfSummary ?? "").toLowerCase().includes(needle)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CurrentAffairsItem[]>();
    for (const item of filtered) {
      const key = formatDay(item);
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const searchHits = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return filtered.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      href: item.sharePath ?? `/learn/current-affairs/${item.slug}`,
      snippet: item.source.name,
    }));
  }, [filtered, query]);

  return (
    <CurrentAffairsWorkspace currentHref={returnTo}>
      <ExploreWorkspaceShell
        returnTo={returnTo}
        searchQuery={query}
        onSearchQueryChange={setQuery}
        searchPlaceholder={`Search ${STUDY_GOAL_LABELS[goal]} current affairs…`}
        searchScopeLabel="Live current affairs"
        searchHits={searchHits}
        searchSearching={loading && query.trim().length > 0}
        searchActive={searchActive}
        onSearchActiveChange={setSearchActive}
        onOpenSearchHit={(href) => router.push(href)}
      >
        <header className="explore-scoped-head !items-start mb-2">
          <div className="min-w-0 flex-1">
            <nav className="explore-breadcrumb" aria-label="Breadcrumb">
              <Link href="/learn" className="hover:text-[var(--accent)]">
                Explore
              </Link>
              <ChevronRight className="w-3 h-3" aria-hidden />
              <span className="text-[var(--text-secondary)]">Current affairs</span>
            </nav>
            <p className="learn-kicker mt-2 flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-[var(--accent)]" />
              Live news digest
            </p>
            <h1 className="page-title mt-1">Current affairs</h1>
            <p className="page-subtitle mt-2 max-w-2xl">
              Copyright-safe summaries from government press and official exam sources.
              Open any item to read, cite, and share — full text stays on the official site.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
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
              className="explore-back-all inline-flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error ? (
          <p className="text-sm text-red-400 mb-4">{error}</p>
        ) : null}

        {!loading && filtered.length === 0 && !error ? (
          <div className="learn-empty">
            No items yet for {STUDY_GOAL_LABELS[goal]}.
            {query.trim() ? " Try a different search." : " Admin can seed sources and run ingestion."}
          </div>
        ) : null}

        {grouped.map(([day, dayItems]) => (
          <section key={day} className="explore-section">
            <div className="explore-section-head">
              <h2 className="explore-section-title">{day}</h2>
              <p className="explore-section-copy">
                {dayItems.length} item{dayItems.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="explore-resource-grid">
              {dayItems.map((item) => (
                <CurrentAffairsItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </ExploreWorkspaceShell>
    </CurrentAffairsWorkspace>
  );
}
