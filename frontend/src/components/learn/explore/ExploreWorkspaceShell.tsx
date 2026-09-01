"use client";

import Link from "next/link";
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
    <div className="explore-workspace">
      <header className="explore-workspace-header">
        <div className="explore-page-inner explore-page-header">
          <div className="explore-home-head">
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
          </div>

          {showSuggestChips && !searchQuery.trim() ? (
            <LibrarySuggestChips
              surface="learn"
              className="mt-5"
              onPick={(item) => onSearchQueryChange(item.query)}
            />
          ) : null}

          <div
            className={`relative z-20 ${
              searchQuery.trim() || !showSuggestChips ? "mt-5" : "mt-3"
            }`}
          >
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
        </div>
      </header>

      <div className="explore-workspace-scroll">
        <div className="explore-page-inner explore-page-body">{children}</div>
      </div>

      {!user ? (
        <footer className="explore-workspace-footer">
          <div className="explore-page-inner">
            <div className="explore-auth-actions">
              <Link href={loginNext} className="explore-auth-card">
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
              <Link href={registerNext} className="explore-auth-card">
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
          </div>
        </footer>
      ) : null}
    </div>
  );
}
