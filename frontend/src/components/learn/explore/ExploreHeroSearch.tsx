"use client";

import { Search } from "lucide-react";
import { LibrarySearchHitsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import type { LearnSearchHit } from "@/lib/learnCatalog";

export function ExploreHeroSearch({
  query,
  onQueryChange,
  placeholder,
  scopeLabel,
  hits,
  searching,
  active,
  onActiveChange,
  onOpenHit,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  placeholder: string;
  scopeLabel?: string;
  hits: LearnSearchHit[];
  searching: boolean;
  active: number;
  onActiveChange: (i: number) => void;
  onOpenHit: (href: string) => void;
}) {
  return (
    <div className="w-full">
      <label className="explore-hero-search">
        <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              onActiveChange(Math.min(active + 1, Math.max(0, hits.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              onActiveChange(Math.max(active - 1, 0));
            } else if (e.key === "Enter" && hits[active]) {
              e.preventDefault();
              onOpenHit(hits[active]!.href);
            }
          }}
          placeholder={placeholder}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm leading-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
        {scopeLabel ? (
          <span className="explore-hero-scope">{scopeLabel}</span>
        ) : null}
      </label>

      {query.trim() ? (
        <ul className="mt-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden max-h-64 overflow-y-auto">
          {searching ? (
            <LibrarySearchHitsSkeleton />
          ) : hits.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[var(--text-muted)]">
              No pages match “{query.trim()}”
            </li>
          ) : (
            hits.map((hit, i) => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => onOpenHit(hit.href)}
                  onMouseEnter={() => onActiveChange(i)}
                  className={`w-full text-left px-4 py-2.5 text-sm ${
                    i === active
                      ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <span className="block font-medium truncate">{hit.title}</span>
                  <span className="block text-xs text-[var(--text-muted)] truncate">
                    {hit.snippet}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
