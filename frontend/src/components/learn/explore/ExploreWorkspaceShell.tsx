"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";
import clsx from "clsx";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { LibrarySuggestChips } from "@/components/LibrarySuggestChips";
import { ExploreHeroSearch } from "@/components/learn/explore/ExploreHeroSearch";
import { useAuth } from "@/hooks/useAuth";
import { useLivelyGreeting } from "@/hooks/useLivelyCopy";
import type { LearnSearchHit } from "@/lib/learnCatalog";

const authPill =
  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]";

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
    <div className="explore-workspace relative">
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

      <div
        className={clsx(
          "explore-workspace-scroll",
          !user && "explore-workspace-scroll-guest"
        )}
      >
        <div className="explore-page-inner explore-page-body">{children}</div>
      </div>

      {!user ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 px-1.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] shadow-[0_8px_28px_rgba(0,0,0,0.14)] max-w-full overflow-x-auto">
            <Link href={loginNext} className={authPill}>
              <LogIn className="w-4 h-4 text-[var(--accent)]" />
              Sign in
            </Link>
            <Link
              href={registerNext}
              className={clsx(authPill, "text-[var(--accent)] bg-[var(--accent-light)] hover:opacity-90")}
            >
              <UserPlus className="w-4 h-4" />
              Create account
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
