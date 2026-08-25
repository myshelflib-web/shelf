"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { requireOnline } from "@/lib/offline/notice";
import { searchLibrary, LibrarySearchHit } from "@/lib/librarySearch";
import { stashStudyAiPending, STUDY_AI_NEW_THREAD } from "@/lib/studyAiPending";

export function DashboardAskBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [aiError, setAiError] = useState("");
  const [results, setResults] = useState<LibrarySearchHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const q = query.trim();
    setAiError("");
    setActive(0);
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = window.setTimeout(() => {
      api.myContent
        .listSubjects({ q, pageSize: 8, sort: "name" })
        .then((res) =>
          setResults(searchLibrary(res.subjects, q, res.rootPages ?? []))
        )
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 180);
    return () => window.clearTimeout(id);
  }, [query]);

  const askAi = async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) return;
    if (!requireOnline("Study AI")) return;
    setAiError("");
    stashStudyAiPending(STUDY_AI_NEW_THREAD, q);
    router.push("/study-ai");
  };

  const openHit = (hit: LibrarySearchHit) => {
    router.push(hit.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (results[active]) {
      openHit(results[active]!);
      return;
    }
    void askAi();
  };

  const showPanel = focused && (query.trim().length > 0 || aiError);

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (results[active]) {
            openHit(results[active]!);
            return;
          }
          void askAi();
        }}
        className="flex items-center gap-1 rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
      >
        <span className="w-11 h-10 inline-flex items-center justify-center text-[var(--text-muted)] shrink-0">
          <Search className="w-4 h-4" strokeWidth={1.8} />
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 160)}
          onKeyDown={onKeyDown}
          placeholder="Search your material or ask anything..."
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => setQuery("")}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (!query.trim()) {
              inputRef.current?.focus();
              return;
            }
            void askAi();
          }}
          className="shrink-0 hidden sm:inline-flex items-center justify-center rounded-[9px] bg-[var(--accent)] text-white px-3.5 py-2 text-xs font-semibold hover:bg-[var(--accent-hover)]"
        >
          Ask AI
        </button>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg overflow-hidden">
          {searching && results.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] px-4 py-3">
              Searching…
            </p>
          )}
          {results.length > 0 && (
            <ul className="max-h-48 overflow-y-auto">
              {results.map((hit, i) => (
                <li key={hit.id}>
                  <Link
                    href={hit.href}
                    onMouseEnter={() => setActive(i)}
                    className={`block px-4 py-2.5 text-sm ${
                      i === active
                        ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <span className="block font-medium truncate">{hit.title}</span>
                    <span className="block text-[11px] text-[var(--text-muted)] truncate">
                      {hit.snippet}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {query.trim() &&
            results.length === 0 &&
            !searching && (
              <p className="text-sm text-[var(--text-muted)] px-4 py-3">
                No title matches — press enter to ask AI.
              </p>
            )}
          {aiError && (
            <p className="text-sm text-red-400 px-4 py-3">{aiError}</p>
          )}
        </div>
      )}
    </div>
  );
}
