"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogIn, Search, UserPlus } from "lucide-react";
import { ShelfLogo } from "@/components/ShelfLogo";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { LibrarySearchHitsSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { useAuth } from "@/hooks/useAuth";
import { useLivelyGreeting } from "@/hooks/useLivelyCopy";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { searchLearnCatalog, type LearnSearchHit } from "@/lib/learnCatalog";

/**
 * Library-style empty mid-pane for the public /learn explorer.
 * Search is local catalog only — Study AI waits until sign-in.
 */
export function LearnGuestWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const loginNext = `/login?next=${encodeURIComponent(pathname || "/learn")}`;
  const registerNext = `/login?register=1&next=${encodeURIComponent(pathname || "/learn")}`;
  const { guestNickname } = useLivelyGreeting();
  const { subjects, loading } = useLearnSubjects();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<LearnSearchHit[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      return;
    }
    setHits(searchLearnCatalog(subjects, q));
    setActive(0);
  }, [query, subjects]);

  const openHit = (href: string) => {
    router.push(href);
  };

  const searching = loading && query.trim().length > 0 && hits.length === 0;

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      <div className="w-full max-w-lg flex flex-col items-center">
        <ShelfLogo size={40} />
        <div className="mt-5 w-full flex justify-center">
          <GreetingBlock
            name={user?.name?.trim() || guestNickname}
            size="md"
            align="center"
            showAccent={false}
            animatedDots
            showSubtitle={false}
          />
        </div>
        <LivelyLine
          surface={user ? "library" : "libraryGuest"}
          className="mt-4 text-sm text-[var(--text-muted)] text-center max-w-sm min-h-[1.25rem]"
        />

        <label className="relative w-full mt-8">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(0, hits.length - 1)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && hits[active]) {
                e.preventDefault();
                openHit(hits[active]!.href);
              }
            }}
            placeholder="Search collections, topics, articles…"
            className="w-full pl-10 pr-4 py-3 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            autoFocus
          />
        </label>

        {query.trim() && (
          <ul className="w-full mt-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden max-h-64 overflow-y-auto">
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
                    onClick={() => openHit(hit.href)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full text-left px-4 py-2.5 text-sm ${
                      i === active
                        ? "bg-[var(--accent-subtle)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <span className="block font-medium truncate">
                      {hit.title}
                    </span>
                    <span className="block text-xs text-[var(--text-muted)] truncate">
                      {hit.snippet}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
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

        <p className="mt-6 text-[11px] text-[var(--text-muted)] text-center">
          {user
            ? "Open a page from the explorer, or save a preloaded file into your library."
            : "Use the explorer to open a page. Sign in to save it and search with Study AI."}
        </p>
      </div>
    </div>
  );
}
