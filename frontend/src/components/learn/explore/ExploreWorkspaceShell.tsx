"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { LibrarySuggestChips } from "@/components/LibrarySuggestChips";
import { ExploreHeroSearch } from "@/components/learn/explore/ExploreHeroSearch";
import { useAuth } from "@/hooks/useAuth";
import { useLivelyGreeting } from "@/hooks/useLivelyCopy";
import type { LearnSearchHit } from "@/lib/learnCatalog";

export function ExploreWorkspaceShell({
  returnTo,
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder,
  searchScopeLabel,
  searchHits,
  searchSearching,
  searchActive,
  onSearchActiveChange,
  onOpenSearchHit,
  showSuggestChips = false,
  children,
}: {
  returnTo: string;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  searchPlaceholder: string;
  searchScopeLabel?: string;
  searchHits: LearnSearchHit[];
  searchSearching: boolean;
  searchActive: number;
  onSearchActiveChange: (i: number) => void;
  onOpenSearchHit: (href: string) => void;
  showSuggestChips?: boolean;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { guestNickname } = useLivelyGreeting();
  const loginNext = `/login?next=${encodeURIComponent(returnTo)}`;
  const registerNext = `/login?register=1&next=${encodeURIComponent(returnTo)}`;

  return (
    <div className="h-full overflow-y-auto">
      <div className="explore-page-inner">
        <header className="explore-home-head">
          <GreetingBlock
            name={user?.name?.trim() || guestNickname}
            size="md"
            align="left"
            showAccent={false}
            animatedDots
            showSubtitle={false}
          />
          <LivelyLine
            surface={user ? "library" : "libraryGuest"}
            className="mt-3 text-sm text-[var(--text-muted)] max-w-2xl min-h-[1.25rem]"
          />
        </header>

        {showSuggestChips && !searchQuery.trim() ? (
          <LibrarySuggestChips
            surface="learn"
            className="mt-6"
            onPick={(item) => onSearchQueryChange(item.query)}
          />
        ) : null}

        <div className={searchQuery.trim() || !showSuggestChips ? "mt-6" : "mt-3"}>
          <ExploreHeroSearch
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            placeholder={searchPlaceholder}
            scopeLabel={searchScopeLabel}
            hits={searchHits}
            searching={searchSearching}
            active={searchActive}
            onActiveChange={onSearchActiveChange}
            onOpenHit={onOpenSearchHit}
          />
        </div>

        <div className="mt-8">{children}</div>

        {!user ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
            <Link
              href={loginNext}
              className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] text-left transition"
            >
              <LogIn className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <span>
                <span className="block text-sm font-medium text-[var(--text-primary)]">
                  Sign in
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  Keep copies and use Study AI
                </span>
              </span>
            </Link>
            <Link
              href={registerNext}
              className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] text-left transition"
            >
              <UserPlus className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <span>
                <span className="block text-sm font-medium text-[var(--text-primary)]">
                  Create account
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  Start your personal shelves
                </span>
              </span>
            </Link>
          </div>
        ) : (
          <div className="mt-10 max-w-xl">
            <Link
              href="/my-content"
              className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] text-left transition"
            >
              <LogIn className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <span>
                <span className="block text-sm font-medium text-[var(--text-primary)]">
                  Open my library
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  Your uploads, highlights, and Study AI
                </span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
