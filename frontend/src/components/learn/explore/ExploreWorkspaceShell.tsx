"use client";

import Link from "next/link";
import clsx from "clsx";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { ExploreHeroSearch } from "@/components/learn/explore/ExploreHeroSearch";
import { GuestAuthStickyBar } from "@/components/learn/GuestAuthStickyBar";
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
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { guestNickname } = useLivelyGreeting();

  return (
    <div className="explore-workspace relative h-full min-h-0">
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

          <div className="relative z-20 mt-5">
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

      {!user ? <GuestAuthStickyBar returnTo={returnTo} /> : null}
    </div>
  );
}
