"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus, FolderPlus, Search, BookOpen } from "lucide-react";
import { ShelfLogo } from "@/components/ShelfLogo";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import {
  LibraryResumeSkeleton,
  LibrarySearchHitsSkeleton,
} from "@/components/dashboard/DashboardSkeletons";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { SHELF_CONTENT_CHANGED, contentChangeFromEvent } from "@/lib/contentEvents";
import { searchLibrary, LibrarySearchHit } from "@/lib/librarySearch";
import { getLastRead, hydrateLastReads, LastRead } from "@/lib/tabViewState";
import { withShortcut } from "@/lib/hotkeys";
import { LibrarySuggestChips } from "@/components/LibrarySuggestChips";

/**
 * Cursor-style empty mid-pane: search the library + add collection/page.
 * Only shown when no document tab is open.
 */
export function LibraryEmptyWorkspace() {
  const router = useRouter();
  const { user } = useAuth();
  const { openAdd } = useAddContent();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<LibrarySearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [libraryEmpty, setLibraryEmpty] = useState(false);
  const [resume, setResume] = useState<LastRead | null>(null);
  const [bootLoading, setBootLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = (opts?: { silent?: boolean }) => {
      const lastRead = api.myContent
        .getLastRead()
        .then((res) => {
          hydrateLastReads(res);
          if (!cancelled) setResume(getLastRead());
        })
        .catch(() => {
          if (!cancelled) setResume(getLastRead());
        });

      const library = api.myContent
        .listSubjects({ pageSize: 1, sort: "recent" })
        .then((res) => {
          if (cancelled) return;
          const empty =
            res.total === 0 && (res.rootPages?.length ?? 0) === 0;
          setLibraryEmpty(empty);
          if (empty) setResume(null);
        })
        .catch(() => {
          if (!cancelled) setLibraryEmpty(false);
        });

      void Promise.all([lastRead, library]).finally(() => {
        if (!cancelled && !opts?.silent) setBootLoading(false);
      });
    };

    load();
    const onChange = (e: Event) => {
      const change = contentChangeFromEvent(e);
      if (
        change?.type === "notebook-created" ||
        change?.type === "page-created"
      ) {
        setLibraryEmpty(false);
      }
      load({ silent: true });
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(SHELF_CONTENT_CHANGED, onChange);
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = window.setTimeout(() => {
      api.myContent
        .listSubjects({ q, pageSize: 50, sort: "name" })
        .then((res) => {
          setHits(searchLibrary(res.subjects, q, res.rootPages ?? []));
          setActive(0);
        })
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 200);
    return () => window.clearTimeout(t);
  }, [query]);

  const openHit = (href: string) => {
    router.push(href);
  };

  const showResume = Boolean(resume?.href && !libraryEmpty);

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-10 overflow-y-auto">
      <div className="w-full max-w-lg flex flex-col items-center">
        <ShelfLogo size={40} />
        {user?.name ? (
          <div className="mt-5 w-full flex justify-center">
            <GreetingBlock
              name={user.name}
              size="md"
              align="center"
              showAccent={false}
              animatedDots
              showSubtitle={false}
            />
          </div>
        ) : (
          <h1 className="mt-5 text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            Shelf
          </h1>
        )}
        <LivelyLine
          surface={
            bootLoading ? "library" : libraryEmpty ? "libraryEmpty" : "library"
          }
          className="mt-4 text-sm text-[var(--text-muted)] text-center max-w-sm min-h-[1.25rem]"
        />

        {(bootLoading || showResume) && (
          <div className="mt-5 w-full min-h-[3.25rem] flex items-center justify-center">
            {bootLoading ? (
              <LibraryResumeSkeleton />
            ) : (
              showResume &&
              resume && (
                <button
                  type="button"
                  onClick={() => openHit(resume.href)}
                  className="animate-fade-in w-full flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--accent)]/30 bg-[var(--accent-subtle)] hover:border-[var(--accent)]/50 text-left transition"
                >
                  <BookOpen className="w-5 h-5 text-[var(--accent)] shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-[var(--text-primary)]">
                      Continue reading
                    </span>
                    <span className="block text-xs text-[var(--text-muted)] truncate">
                      {resume.title || "Last page"}
                    </span>
                  </span>
                </button>
              )
            )}
          </div>
        )}

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
            placeholder="Search across all collections…"
            className="w-full pl-10 pr-4 py-3 rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            autoFocus
          />
        </label>

        {query.trim() ? (
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
        ) : (
          <LibrarySuggestChips
            surface="library"
            onPick={(item) => setQuery(item.query)}
          />
        )}

        <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => openAdd({ kind: "notebook" })}
            title={withShortcut("Create a new collection", "c n")}
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] text-left transition"
          >
            <FolderPlus className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span>
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                New collection
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                Group topics and pages
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => openAdd({ kind: "page" })}
            title={withShortcut("Add a PDF, notes page, or link", "c p")}
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)] text-left transition"
          >
            <FilePlus className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <span>
              <span className="block text-sm font-medium text-[var(--text-primary)]">
                Add page
              </span>
              <span className="block text-xs text-[var(--text-muted)]">
                PDF, notes, or link
              </span>
            </span>
          </button>
        </div>

        <p className="mt-6 text-[11px] text-[var(--text-muted)] text-center">
          Drop a PDF onto this page to upload, or use the sidebar to browse.
        </p>
      </div>
    </div>
  );
}
