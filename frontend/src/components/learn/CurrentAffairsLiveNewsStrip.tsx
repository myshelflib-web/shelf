"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExploreResourceCard, ExploreResourceCardSkeleton } from "@/components/learn/explore/ExploreResourceCard";
import { ChevronRight, Newspaper } from "lucide-react";
import { api } from "@/lib/api";
import type { CurrentAffairsItem } from "@/types";

export function CurrentAffairsLiveNewsStrip() {
  const [items, setItems] = useState<CurrentAffairsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.currentAffairs.list({ goal: "UPSC", limit: 5 });
      setItems(res.items.slice(0, 5));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="explore-section">
      <div className="explore-section-head flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="explore-section-title flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[var(--accent)]" />
            Live current affairs
          </h2>
          <p className="explore-section-copy">
            Summaries from PIB, PRS, and official sources — citeable on Shelf.
          </p>
        </div>
        <Link
          href="/learn/current-affairs"
          className="text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1"
        >
          View all
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <ul className="explore-resource-grid mt-4">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i} className="list-none">
                <ExploreResourceCardSkeleton />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id} className="list-none">
                <ExploreResourceCard
                  href={item.sharePath ?? `/learn/current-affairs/${item.slug}`}
                  typeLabel="Current affairs"
                  title={item.title}
                  meta={item.source.name}
                  copy={
                    item.shelfSummary ??
                    "Official source summary — open to read and cite."
                  }
                  openLabel="Read article"
                />
              </li>
            ))}
      </ul>
    </section>
  );
}
