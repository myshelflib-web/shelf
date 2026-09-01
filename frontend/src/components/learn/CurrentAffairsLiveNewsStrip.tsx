"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
            AI summaries from PIB, PRS, and official sources — citeable on Shelf.
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

      <ul className="space-y-2 mt-4 max-w-3xl">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <div className="h-14 rounded-[10px] bg-[var(--bg-secondary)] animate-pulse" />
              </li>
            ))
          : items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.sharePath ?? `/learn/current-affairs/${item.slug}`}
                  className="block rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 hover:border-[var(--accent)]/40 transition"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)] line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {item.source.name}
                    {item.shelfSummary
                      ? ` · ${item.shelfSummary.slice(0, 80)}${item.shelfSummary.length > 80 ? "…" : ""}`
                      : ""}
                  </p>
                </Link>
              </li>
            ))}
      </ul>
    </section>
  );
}
