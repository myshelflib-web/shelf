"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Folder, Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { listSubjects, peekCachedLibrary } from "@/lib/offline/library";
import { CircleLoader } from "@/components/CircleLoader";
import { UserSubject, UserPageSummary } from "@/types";
import { searchLibrary, LibrarySearchHit } from "@/lib/librarySearch";
import { AnalyticsEvents, track } from "@/lib/analytics";

type Result = LibrarySearchHit & { kind: "PAGE" | "NOTEBOOK" };

const SUGGESTIONS: Array<{ label: string; query?: string; href?: string }> = [
  { label: "Summarize this week", query: "Summarize what I studied this week" },
  { label: "Start a quiz", href: "/quiz" },
  { label: "Key terms to revise", query: "Key terms I should revise" },
  { label: "Make a revision plan", query: "Make a revision plan from my collections" },
];

function classify(hit: LibrarySearchHit): Result {
  return { ...hit, kind: "PAGE" };
}

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sections, setSections] = useState<UserSubject[]>([]);
  const [rootPages, setRootPages] = useState<UserPageSummary[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    track(AnalyticsEvents.searchOpened);
    setQuery("");
    setDebounced("");
    setActive(0);
    setAiAnswer(null);
    const cached = peekCachedLibrary();
    if (cached) {
      setSections(cached.subjects);
      setRootPages(cached.rootPages ?? []);
      setLibraryLoading(false);
    } else {
      setLibraryLoading(true);
    }
    void listSubjects()
      .then((res) => {
        setSections(res.subjects);
        setRootPages(res.rootPages ?? []);
      })
      .catch(() => {
        if (!cached) {
          setSections([]);
          setRootPages([]);
        }
      })
      .finally(() => setLibraryLoading(false));
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 160);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    setAiAnswer(null);
    setActive(0);
  }, [debounced]);

  const results = useMemo(() => {
    const pages = searchLibrary(sections, debounced, rootPages).map(classify);
    if (!debounced) return pages;
    const extra: Result[] = [];
    for (const s of sections) {
      if (!s.name.toLowerCase().includes(debounced.toLowerCase())) continue;
      extra.push({
        id: `nb-${s.id}`,
        title: s.name,
        href: `/my-content`,
        notebook: s.name,
        topic: "",
        snippet: "Collection — open in Library explorer",
        kind: "NOTEBOOK",
      });
    }
    return [...extra, ...pages].slice(0, 8);
  }, [sections, rootPages, debounced]);

  const selected = results[active];

  const openResult = useCallback(
    (hit: Result) => {
      track(AnalyticsEvents.searchResultClicked, {
        kind: hit.kind,
        hasQuery: Boolean(debounced),
      });
      router.push(hit.href);
      onClose();
    },
    [debounced, onClose, router]
  );

  const askAi = useCallback(async (text?: string) => {
    const q = (text ?? query).trim();
    if (!q || aiLoading) return;
    setQuery(q);
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const { answer } = await api.study.libraryAsk({ query: q });
      setAiAnswer(answer);
    } catch (err) {
      setAiAnswer(err instanceof Error ? err.message : "AI search failed");
    } finally {
      setAiLoading(false);
    }
  }, [query, aiLoading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(results.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (selected) {
          openResult(selected);
        } else if (query.trim()) {
          void askAi();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, results.length, selected, query, askAi, openResult]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[12vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close search"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search library"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
      >
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections, pages…"
            className="no-focus-ring flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={() => void askAi()}
            disabled={!query.trim() || aiLoading}
            className="no-focus-ring shrink-0 inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-35"
            aria-label="Ask AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask AI
          </button>
        </div>

        <div className="min-h-[12rem] max-h-[20rem] overflow-y-auto py-1.5">
          {libraryLoading && debounced && results.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <CircleLoader size="md" label="Searching library" />
            </div>
          ) : (
            <>
              {!debounced && !aiAnswer && (
                <ul>
                  {SUGGESTIONS.map((s) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        onClick={() => {
                          if (s.href) {
                            router.push(s.href);
                            onClose();
                            return;
                          }
                          if (s.query) void askAi(s.query);
                        }}
                        className="no-focus-ring w-full text-left text-[13px] px-3.5 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {debounced && results.length === 0 && !aiAnswer && !aiLoading && (
                <p className="text-[13px] text-[var(--text-muted)] text-center px-4 py-10">
                  No matches. Press Enter to ask AI.
                </p>
              )}

              {results.length > 0 && (
                <ul>
                  {results.map((hit, i) => (
                    <li key={hit.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => openResult(hit)}
                        className={`no-focus-ring w-full text-left px-3.5 py-1.5 flex items-center gap-2.5 text-[13px] ${
                          i === active
                            ? "text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                            : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {hit.kind === "NOTEBOOK" ? (
                          <Folder className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        )}
                        <span className="min-w-0 flex-1 truncate">{hit.title}</span>
                        <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[40%]">
                          {hit.notebook}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {aiLoading && (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                  <CircleLoader size="md" label="Asking Study AI" />
                  <p className="text-[13px] text-[var(--text-muted)]">
                    Searching your library…
                  </p>
                </div>
              )}
              {aiAnswer && (
                <p className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed px-3.5 py-3 animate-fade-in">
                  {aiAnswer}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-4 px-3.5 py-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="font-sans">↑↓</kbd> Navigate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="font-sans">↵</kbd> Select
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="font-sans">esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
