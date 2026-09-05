"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { LibrarySuggestChips } from "@/components/LibrarySuggestChips";
import { CurrentAffairsLiveNewsStrip } from "@/components/learn/CurrentAffairsLiveNewsStrip";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { ExploreHeroSearch } from "@/components/learn/explore/ExploreHeroSearch";
import { useAuth } from "@/hooks/useAuth";
import { useLivelyGreeting } from "@/hooks/useLivelyCopy";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import {
  collectionMeta,
  countAreaItems,
  featuredExploreCollections,
  learnAreaHref,
  subjectExploreHref,
  visibleExploreAreas,
} from "@/lib/exploreCatalog";
import { searchLearnCatalog } from "@/lib/learnCatalog";
import { useEffect, useState } from "react";

export function ExploreHomePane() {
  const router = useRouter();
  const pathname = "/learn";
  const { user } = useAuth();
  const { guestNickname } = useLivelyGreeting();
  const { subjects, loading } = useLearnSubjects();
  const loginNext = `/login?next=${encodeURIComponent(pathname)}`;
  const registerNext = `/login?register=1&next=${encodeURIComponent(pathname)}`;

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<ReturnType<typeof searchLearnCatalog>>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    setHits(searchLearnCatalog(subjects, q));
    setActive(0);
  }, [query, subjects]);

  const featured = featuredExploreCollections(subjects);
  const searching = loading && query.trim().length > 0 && hits.length === 0;
  const areas = loading ? [] : visibleExploreAreas(subjects);

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
          <p className="mt-4 text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
            Search generated study pages or browse by area. When something is
            useful, open it and save a copy into your own Library.
          </p>
        </header>

        {!query.trim() ? (
          <LibrarySuggestChips
            surface="learn"
            className="mt-6"
            onPick={(item) => setQuery(item.query)}
          />
        ) : null}

        <div className={query.trim() ? "mt-6" : "mt-3"}>
          <ExploreHeroSearch
            query={query}
            onQueryChange={setQuery}
            placeholder="Search study skills, polity, economy…"
            scopeLabel="Public material"
            hits={hits}
            searching={searching}
            active={active}
            onActiveChange={setActive}
            onOpenHit={(href) => router.push(href)}
          />
        </div>

        {areas.length > 0 ? (
          <section className="explore-section">
            <div className="explore-section-head">
              <h2 className="explore-section-title">Browse by area</h2>
              <p className="explore-section-copy">Choose a broad context, then narrow down.</p>
            </div>
            <div className="explore-area-grid">
              {areas.map((area) => {
                const count = countAreaItems(subjects, area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => router.push(learnAreaHref(area.id))}
                    className="explore-area-card"
                  >
                    <ExploreAreaIcon tone={area.tone} />
                    <p className="explore-area-title">{area.title}</p>
                    <p className="explore-area-copy">{area.description}</p>
                    <p className="explore-area-count">
                      {count} article{count === 1 ? "" : "s"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <CurrentAffairsLiveNewsStrip />

        {featured.length > 0 ? (
          <section className="explore-section">
            <div className="explore-section-head">
              <h2 className="explore-section-title">Public collections</h2>
              <p className="explore-section-copy">
                Useful generated collections already available on Shelf.
              </p>
            </div>
            <div className="explore-collection-grid">
              {featured.map((subject) => (
                <Link
                  key={subject.id}
                  href={subjectExploreHref(subject.slug)}
                  className="explore-collection-card"
                >
                  <span className="explore-collection-mark" aria-hidden>
                    {subject.icon || subject.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="explore-collection-title">{subject.name}</span>
                    <span className="explore-collection-meta">
                      {collectionMeta(subject)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
          {user ? (
            <Link
              href="/my-content"
              className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] text-left transition sm:col-span-2"
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
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
