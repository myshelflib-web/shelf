"use client";

import { NotebookSort, UserSubject, UserPageSummary } from "@/types";
import {
  getNotebookPages,
  getTopicGroups,
  insertPageInTree,
  insertTopicInTree,
  pageHref,
  syncPageInTree,
  syncRootPages,
} from "@/lib/myContentTree";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
  Check,
  Star,
  BookOpen,
  Trash2,
  CalendarDays,
  FileText,
  Pencil,
  FilePlus,
  FolderPlus,
  RefreshCw,
  FoldVertical,
  Search,
  ArrowDownWideNarrow,
  Share2,
} from "lucide-react";
import { SharedWithMeSection } from "@/components/my-content/SharedWithMeSection";
import { SharePageModal } from "@/components/my-content/SharePageModal";
import { FolderMark } from "@/components/FolderMark";
import { folderTone } from "@/lib/folderTone";
import { ExplorerSidebarSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { listSubjects } from "@/lib/offline/library";
import { api } from "@/lib/api";
import { listTasks } from "@/lib/offline/tasks";
import { useScheduledPageHrefs } from "@/hooks/useScheduledPageHrefs";
import clsx from "clsx";
import { withShortcut } from "@/lib/hotkeys";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PersonalPageReaderScope,
  SHELF_PAGE_MIME,
  ShelfPageDragPayload,
  scopeFromHref,
} from "@/components/my-content/reader/types";
import { NotebookEditModal } from "@/components/my-content/NotebookEditModal";
import { getNotebookLastRead, hydrateLastReads } from "@/lib/tabViewState";
import {
  SHELF_CONTENT_CHANGED,
  contentChangeFromEvent,
  emitContentChanged,
  emitPageRenamed,
} from "@/lib/contentEvents";

const SIDEBAR_NOTEBOOK_PAGE_SIZE = 15;
const SIDEBAR_ROOT_PAGE_SIZE = 12;
const PINNED_KEY = "shelf:explorer-pinned";
const MAX_PINNED = 5;

type SortCriterion = "activity" | "name";

const SORT_CRITERIA: { id: SortCriterion; label: string }[] = [
  { id: "activity", label: "Last activity" },
  { id: "name", label: "Name" },
];

function notebookSortFor(
  criterion: SortCriterion,
  ascending: boolean
): NotebookSort {
  if (criterion === "name") return ascending ? "name" : "nameDesc";
  return ascending ? "oldest" : "recent";
}

function directionTitle(criterion: SortCriterion, ascending: boolean): string {
  if (criterion === "name") {
    return ascending ? "Ascending — A to Z" : "Descending — Z to A";
  }
  return ascending
    ? "Ascending — least recent first"
    : "Descending — most recent first";
}

function readPinnedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

function pushPinnedSlug(slug: string) {
  const next = [slug, ...readPinnedSlugs().filter((s) => s !== slug)].slice(
    0,
    MAX_PINNED
  );
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

interface MyContentSidebarProps {
  /** Extra notebook detail (e.g. currently open) merged into the tree when present. */
  notebook?: UserSubject;
  notebookSlug?: string;
  currentTopicSlug?: string;
  currentPageSlug?: string;
  currentHref?: string;
  enablePageDrag?: boolean;
  workspaceMode?: boolean;
  onOpenPage?: (payload: {
    href: string;
    title: string;
    pageId: string;
    scope: PersonalPageReaderScope;
  }) => void;
  className?: string;
  /** Optional Personal / Preloaded tab strip above the explorer tools. */
  libraryModeTabs?: ReactNode;
}

export function MyContentSidebar({
  notebook,
  notebookSlug,
  currentTopicSlug,
  currentPageSlug,
  currentHref,
  enablePageDrag = false,
  workspaceMode = false,
  onOpenPage,
  className,
  libraryModeTabs,
}: MyContentSidebarProps) {
  const { openAdd } = useAddContent();
  const router = useRouter();

  const [sortCriterion, setSortCriterion] = useState<SortCriterion>("activity");
  const [sortAscending, setSortAscending] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sort = notebookSortFor(sortCriterion, sortAscending);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [notebookPage, setNotebookPage] = useState(1);
  const [rootPage, setRootPage] = useState(1);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [rootPages, setRootPages] = useState<UserPageSummary[]>([]);
  const [pinnedExtra, setPinnedExtra] = useState<UserSubject[]>([]);
  const [totalNotebooks, setTotalNotebooks] = useState(0);
  const [totalNotebookPages, setTotalNotebookPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editNotebook, setEditNotebook] = useState<UserSubject | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const searching = debouncedQ.length > 0;
  const scheduledHrefs = useScheduledPageHrefs(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 220);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!sortOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [sortOpen]);

  useEffect(() => {
    setNotebookPage(1);
  }, [sort, debouncedQ]);

  /** Remember notebooks the user opens so they stay visible across paginated lists. */
  useEffect(() => {
    if (!notebookSlug) return;
    pushPinnedSlug(notebookSlug);
  }, [notebookSlug]);

  const load = useCallback((opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    listSubjects({
        page: searching ? 1 : notebookPage,
        pageSize: SIDEBAR_NOTEBOOK_PAGE_SIZE,
        sort,
        q: searching ? debouncedQ : undefined,
      })
      .then((res) => {
        setSubjects(res.subjects);
        setRootPages(res.rootPages ?? []);
        setTotalNotebooks(res.total);
        setTotalNotebookPages(Math.max(1, res.totalPages));
      })
      .catch(() => {
        if (!opts?.silent) {
          setSubjects([]);
          setRootPages([]);
          setTotalNotebooks(0);
          setTotalNotebookPages(1);
        }
      })
      .finally(() => setLoading(false));
  }, [notebookPage, sort, searching, debouncedQ]);

  useEffect(() => {
    load();
    const onChange = (e: Event) => {
      const change = contentChangeFromEvent(e);
      if (change?.type === "notebook-created") {
        setSubjects((prev) =>
          prev.some((s) => s.id === change.subject.id)
            ? prev
            : [change.subject, ...prev]
        );
        setTotalNotebooks((n) => n + 1);
        setExpandedNotebooks((prev) => ({
          ...prev,
          [change.subject.slug]: true,
        }));
      } else if (change?.type === "topic-created") {
        setSubjects((prev) =>
          insertTopicInTree(prev, change.notebookId, change.topicGroup)
        );
        setPinnedExtra((prev) =>
          insertTopicInTree(prev, change.notebookId, change.topicGroup)
        );
        setExpandedNotebooks((prev) => ({
          ...prev,
          [change.notebookSlug]: true,
        }));
      } else if (change?.type === "page-created") {
        if (change.notebookId) {
          setSubjects((prev) =>
            insertPageInTree(
              prev,
              change.page,
              change.notebookId,
              change.topicId
            )
          );
          setPinnedExtra((prev) =>
            insertPageInTree(
              prev,
              change.page,
              change.notebookId,
              change.topicId
            )
          );
        } else {
          setRootPages((prev) =>
            prev.some((p) => p.id === change.page.id)
              ? prev
              : [change.page, ...prev]
          );
        }
        if (change.notebookSlug) {
          setExpandedNotebooks((prev) => ({
            ...prev,
            [change.notebookSlug as string]: true,
          }));
        }
        if (change.notebookSlug && change.topicSlug) {
          setExpandedTopics((prev) => ({
            ...prev,
            [`${change.notebookSlug}:${change.topicSlug}`]: true,
          }));
        }
      } else if (change?.type === "page-renamed") {
        setRootPages((prev) =>
          syncRootPages(prev, change.pageId, { title: change.title })
        );
        setSubjects((prev) =>
          syncPageInTree(prev, change.pageId, { title: change.title })
        );
        setPinnedExtra((prev) =>
          syncPageInTree(prev, change.pageId, { title: change.title })
        );
      } else {
        load({ silent: true });
      }
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(SHELF_CONTENT_CHANGED, onChange);
  }, [load]);

  useEffect(() => {
    api.myContent
      .getLastRead()
      .then(hydrateLastReads)
      .catch(() => undefined);
  }, []);

  /** Hydrate pinned notebooks that aren't on the current page. */
  useEffect(() => {
    const slugs = readPinnedSlugs().filter(
      (s) => !subjects.some((nb) => nb.slug === s)
    );
    if (notebook && !subjects.some((s) => s.id === notebook.id)) {
      if (!slugs.includes(notebook.slug)) slugs.unshift(notebook.slug);
    }
    if (!slugs.length) {
      setPinnedExtra([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      slugs.slice(0, MAX_PINNED).map((slug) =>
        api.myContent
          .getSubject(slug)
          .then((r) => r.subject)
          .catch(() => null)
      )
    ).then((rows) => {
      if (cancelled) return;
      setPinnedExtra(rows.filter((r): r is UserSubject => r != null));
    });
    return () => {
      cancelled = true;
    };
  }, [subjects, notebook]);

  useEffect(() => {
    setRootPage(1);
  }, [rootPages.length, debouncedQ]);

  const treeSubjects = useMemo(() => {
    const byId = new Map<string, UserSubject>();
    // Open notebook first, then other pinned, then current page results
    if (notebook) byId.set(notebook.id, notebook);
    for (const nb of pinnedExtra) {
      if (!byId.has(nb.id)) byId.set(nb.id, nb);
    }
    for (const nb of subjects) {
      if (!byId.has(nb.id)) byId.set(nb.id, nb);
    }
    return [...byId.values()];
  }, [subjects, pinnedExtra, notebook]);

  const filteredRootPages = useMemo(() => {
    if (!searching) return rootPages;
    const q = debouncedQ.toLowerCase();
    return rootPages.filter((p) => p.title.toLowerCase().includes(q));
  }, [rootPages, searching, debouncedQ]);

  const rootTotalPages = Math.max(
    1,
    Math.ceil(filteredRootPages.length / SIDEBAR_ROOT_PAGE_SIZE)
  );
  const visibleRootPages = filteredRootPages.slice(
    (rootPage - 1) * SIDEBAR_ROOT_PAGE_SIZE,
    rootPage * SIDEBAR_ROOT_PAGE_SIZE
  );

  const [expandedNotebooks, setExpandedNotebooks] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    if (notebookSlug) init[notebookSlug] = true;
    return init;
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      if (notebookSlug && currentTopicSlug) {
        init[`${notebookSlug}:${currentTopicSlug}`] = true;
      }
      return init;
    }
  );

  useEffect(() => {
    if (!notebookSlug) return;
    setExpandedNotebooks((prev) =>
      prev[notebookSlug] ? prev : { ...prev, [notebookSlug]: true }
    );
    if (currentTopicSlug) {
      const key = `${notebookSlug}:${currentTopicSlug}`;
      setExpandedTopics((prev) =>
        prev[key] ? prev : { ...prev, [key]: true }
      );
    }
  }, [notebookSlug, currentTopicSlug]);

  const toggleNotebook = (slug: string) => {
    const willOpen = !expandedNotebooks[slug];
    setExpandedNotebooks((prev) => ({ ...prev, [slug]: !prev[slug] }));
    if (willOpen && !workspaceMode) {
      const last = getNotebookLastRead(slug);
      if (last?.href) router.push(last.href);
    }
  };

  const toggleTopic = (notebookSlugKey: string, topicSlug: string) => {
    const key = `${notebookSlugKey}:${topicSlug}`;
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const collapseAll = () => {
    setExpandedNotebooks({});
    setExpandedTopics({});
  };

  const renameTopic = async (
    nb: UserSubject,
    groupId: string,
    title: string
  ) => {
    await api.myContent.updateTopicGroup(nb.id, groupId, { title });
    emitContentChanged();
  };

  const renamePage = async (pageId: string, title: string) => {
    await api.myContent.updatePageTitle(pageId, title);
    emitPageRenamed(pageId, title);
  };

  const deleteTopic = async (
    nb: UserSubject,
    groupId: string,
    title: string
  ) => {
    if (!confirm(`Delete topic "${title}" and its pages?`)) return;
    await api.myContent.deleteTopicGroup(nb.id, groupId);
    emitContentChanged();
  };

  const deletePage = async (pageId: string, title: string) => {
    if (!confirm(`Delete page "${title}"?`)) return;
    await api.myContent.deletePage(pageId);
    emitContentChanged();
    if (!workspaceMode) router.push("/my-content");
  };

  const openPage = (page: UserPageSummary, href: string) => {
    const scope = scopeFromHref(href);
    if (workspaceMode && onOpenPage && scope) {
      onOpenPage({
        href,
        title: page.title,
        pageId: page.id,
        scope,
      });
      return;
    }
    router.push(href);
  };

  const renderPageRow = (
    page: UserPageSummary,
    href: string,
    isActive: boolean
  ) => {
    const isScheduled = scheduledHrefs.has(href);
    const scope = scopeFromHref(href);
    const dragProps =
      enablePageDrag && scope
        ? {
            draggable: true as const,
            onDragStart: (e: React.DragEvent) => {
              const payload: ShelfPageDragPayload = {
                href,
                title: page.title,
                pageId: page.id,
                scope,
              };
              e.dataTransfer.setData(SHELF_PAGE_MIME, JSON.stringify(payload));
              e.dataTransfer.setData("text/plain", href);
              e.dataTransfer.effectAllowed = "copy";
            },
          }
        : {};

    return (
      <div
        key={page.id}
        {...dragProps}
        role="button"
        tabIndex={0}
        onClick={() => openPage(page, href)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPage(page, href);
          }
        }}
        className={clsx(
          "library-row group flex items-center gap-1 rounded-md text-[13px] min-w-0 px-1.5 py-1 cursor-pointer",
          isActive
            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
          enablePageDrag && "active:cursor-grabbing"
        )}
      >
          {page.completed ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
          ) : (
          <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
        )}
        <span
          className={`flex-1 min-w-0 truncate text-[13px] ${
            isActive
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-secondary)]"
          }`}
          title={page.title}
        >
          {page.title}
        </span>
        <span
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100"
            title="Share page"
            aria-label="Share page"
            onClick={() => setShareTarget({ id: page.id, title: page.title })}
          >
            <Share2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100"
            title="Rename page"
            onClick={async () => {
              const title = prompt("Rename page", page.title);
              if (!title?.trim() || title.trim() === page.title) return;
              await renamePage(page.id, title.trim());
            }}
          >
            <Pencil className="w-3 h-3" />
          </button>
        {isScheduled && (
            <span title="Scheduled to read">
            <CalendarDays className="w-3 h-3 text-[var(--accent)]" />
          </span>
        )}
        {page.starred && (
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        )}
        <button
          type="button"
            className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100"
          title="Delete page"
          onClick={() => deletePage(page.id, page.title)}
        >
          <Trash2 className="w-3 h-3" />
        </button>
        </span>
      </div>
    );
  };

  const isEmpty =
    !loading && treeSubjects.length === 0 && filteredRootPages.length === 0;

  const sortLabel =
    SORT_CRITERIA.find((s) => s.id === sortCriterion)?.label ?? "Last activity";
  const sortDirTitle = directionTitle(sortCriterion, sortAscending);

  return (
    <>
    <aside
      className={clsx(
        "w-72 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col h-full overflow-hidden",
        className
      )}
    >
      <div className="p-2 border-b border-[var(--border)] space-y-2">
        {libraryModeTabs}
        <div className="flex items-center gap-1 min-w-0 px-1">
          <FolderOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <h2 className="font-semibold text-sm truncate flex-1 min-w-0">
            Explorer
          </h2>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              title={withShortcut("Add a page to your library", "c p")}
              aria-label="Add page"
              onClick={() => openAdd({ kind: "page" })}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              title={withShortcut("Create a new collection", "c n")}
              aria-label="New collection"
              onClick={() => openAdd({ kind: "notebook" })}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Refresh library list"
              aria-label="Refresh"
              onClick={() => load()}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              title="Collapse all collections and topics"
              aria-label="Collapse all"
              onClick={collapseAll}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FoldVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {workspaceMode && (
          <div className="relative px-0.5">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search collections…"
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>
        )}

        <div className="px-0.5 pt-0.5" ref={sortRef}>
          <p className="text-[9.5px] uppercase tracking-[0.05em] font-bold text-[var(--text-muted)] px-1 mb-1.5">
            Sort by
          </p>
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
                aria-label={`Sort by ${sortLabel}`}
                onClick={() => setSortOpen((open) => !open)}
                className={clsx(
                  "w-full h-[34px] flex items-center justify-between gap-2 px-2.5 rounded-lg border text-[11px] font-semibold transition-colors",
                  sortOpen
                    ? "border-[var(--accent)]/40 bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
                )}
              >
                <span className="truncate">{sortLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-70" />
              </button>
              {sortOpen && (
                <div
                  role="listbox"
                  aria-label="Sort collections"
                  className="absolute z-20 left-0 right-0 top-[39px] rounded-[9px] border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-lg"
                >
                  {SORT_CRITERIA.map((s) => {
                    const selected = sortCriterion === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={clsx(
                          "w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[11px] text-left",
                          selected
                            ? "text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                        )}
                        onClick={() => {
                          setSortCriterion(s.id);
                          setSortOpen(false);
                        }}
                      >
                        <span>{s.label}</span>
                        {selected ? (
                          <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              title={sortDirTitle}
              aria-label={sortDirTitle}
              onClick={() => setSortAscending((v) => !v)}
              className="w-[34px] h-[34px] shrink-0 grid place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] transition-colors"
            >
              <ArrowDownWideNarrow
                className={clsx(
                  "w-4 h-4 transition-transform duration-150",
                  sortAscending && "scale-y-[-1]"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2">
        {loading && subjects.length === 0 && pinnedExtra.length === 0 ? (
          <ExplorerSidebarSkeleton />
        ) : isEmpty ? (
          <div className="px-3 py-6 text-center space-y-3">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              {searching
                ? `No collections match “${debouncedQ}”.`
                : "Your library is empty. Add a collection or page to get started."}
            </p>
            {!searching && (
              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  title="New collection"
                  onClick={() => openAdd({ kind: "notebook" })}
                  className="p-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  <FolderPlus className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  title="Add page"
                  onClick={() => openAdd({ kind: "page" })}
                  className="p-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  <FilePlus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {filteredRootPages.length > 0 && (
              <div className="mb-2 space-y-0.5">
                <div className="flex items-center justify-between gap-1 px-2 py-1">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">
                  Pages
                </p>
                  {rootTotalPages > 1 && (
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {rootPage}/{rootTotalPages}
                    </span>
                  )}
                </div>
                {visibleRootPages.map((page) => {
                  const href = pageHref(null, null, page.slug);
                  const isActive =
                    currentHref === href ||
                    (!currentHref && currentPageSlug === page.slug);
                  return (
                    <div key={page.id}>{renderPageRow(page, href, isActive)}</div>
                  );
                })}
                {rootTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 px-1 pt-1">
                    <button
                      type="button"
                      disabled={rootPage <= 1}
                      onClick={() => setRootPage((p) => Math.max(1, p - 1))}
                      className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
                      aria-label="Previous pages"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={rootPage >= rootTotalPages}
                      onClick={() =>
                        setRootPage((p) => Math.min(rootTotalPages, p + 1))
                      }
                      className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
                      aria-label="Next pages"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {treeSubjects.length > 0 && (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-1 px-2 py-1">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)] font-medium">
                    {searching ? "Matches" : "Collections"}
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                    {searching ? treeSubjects.length : totalNotebooks}
                  </span>
                </div>
                {treeSubjects.map((nb) => {
                  const open = expandedNotebooks[nb.slug] ?? false;
                  const loose = getNotebookPages(nb);
                  const groups = getTopicGroups(nb);
                  const isPinned =
                    notebook?.id === nb.id ||
                    pinnedExtra.some((p) => p.id === nb.id);
                return (
                    <div key={nb.id} className="mb-0.5">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleNotebook(nb.slug)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleNotebook(nb.slug);
                          }
                        }}
                        className={clsx(
                          "group flex items-center gap-0.5 px-1.5 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-elevated)]",
                          isPinned && notebook?.id === nb.id
                            ? "bg-[var(--bg-elevated)]/60"
                            : ""
                        )}
                      >
                        <span className="p-0.5 text-[var(--text-muted)] shrink-0">
                          {open ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <FolderMark seed={nb.id} size={14} />
                        <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[var(--text-primary)] text-left">
                          {nb.name}
                        </span>
                        <span
                          className={clsx(
                            "flex items-center shrink-0 transition-opacity",
                            notebook?.id === nb.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            title="Edit collection name and description"
                            aria-label="Edit collection"
                            onClick={() => setEditNotebook(nb)}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            title="Add a topic in this collection"
                            aria-label="New topic"
                            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            onClick={() =>
                              openAdd({ kind: "topic", notebook: nb })
                            }
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Add a page in this collection"
                            aria-label="Add page"
                            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                            onClick={() =>
                              openAdd({ kind: "page", notebook: nb })
                            }
                          >
                            <FilePlus className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </div>

                      {open && (
                        <div className="ml-3 pl-2 border-l border-[var(--border)] space-y-0.5 mt-0.5">
                          {loose.map((page) => {
                            const href = pageHref(nb.slug, null, page.slug);
                            const isActive =
                              currentHref === href ||
                              (notebookSlug === nb.slug &&
                                !currentTopicSlug &&
                                currentPageSlug === page.slug);
                            return (
                              <div key={page.id}>
                                {renderPageRow(page, href, isActive)}
                              </div>
                            );
                          })}
                          {groups.map((group) => {
                            const tKey = `${nb.slug}:${group.slug}`;
                            const tOpen = expandedTopics[tKey] ?? false;
                            const tone = folderTone(group.id);
                            return (
                              <div key={group.id}>
                                <div
                                  role="button"
                                  tabIndex={0}
                                  onClick={() =>
                                    toggleTopic(nb.slug, group.slug)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      toggleTopic(nb.slug, group.slug);
                                    }
                                  }}
                                  className="group flex items-center gap-0.5 px-1 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-elevated)]"
                                >
                                  <span className="p-0.5 text-[var(--text-muted)] shrink-0">
                                    {tOpen ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </span>
                        <BookOpen
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: tone.fg }}
                        />
                                  <span className="flex-1 min-w-0 truncate text-[13px] font-medium">
                                    {group.title}
                                  </span>
                                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                        {group.pages.length}
                      </span>
                                  <span
                                    className="flex items-center shrink-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                                      title="Rename topic"
                                      aria-label="Rename topic"
                                      onClick={async () => {
                                        const title = prompt(
                                          "Rename topic",
                                          group.title
                                        );
                                        if (
                                          !title?.trim() ||
                                          title.trim() === group.title
                                        )
                                          return;
                                        await renameTopic(
                                          nb,
                                          group.id,
                                          title.trim()
                                        );
                                      }}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Add page"
                                      aria-label="Add page"
                                      className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                                      onClick={() =>
                                        openAdd({
                                          kind: "page",
                                          notebook: nb,
                                          topic: group,
                                        })
                                      }
                                    >
                                      <FilePlus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)]"
                                      title="Delete topic"
                                      aria-label="Delete topic"
                                      onClick={() =>
                                        deleteTopic(nb, group.id, group.title)
                                      }
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </span>
                    </div>
                                {tOpen && (
                                  <div className="ml-3 space-y-0.5 mt-0.5">
                        {group.pages.map((page) => {
                          const href = pageHref(
                                        nb.slug,
                            group.slug,
                            page.slug
                          );
                          const isActive =
                                        currentHref === href ||
                                        (notebookSlug === nb.slug &&
                            currentTopicSlug === group.slug &&
                                          currentPageSlug === page.slug);
                                      return (
                                        <div key={page.id}>
                                          {renderPageRow(page, href, isActive)}
                                        </div>
                                      );
                                    })}
                      </div>
                    )}
                  </div>
                );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        <SharedWithMeSection
          workspaceMode={workspaceMode}
          onOpenPage={onOpenPage}
          activePageId={
            currentHref?.includes("/shared/")
              ? currentHref.split("/shared/")[1]?.split("?")[0]
              : null
          }
        />
      </nav>

      {!searching && totalNotebookPages > 1 && (
        <div className="px-2 py-1.5 border-t border-[var(--border)] flex items-center justify-between gap-1 shrink-0">
          <button
            type="button"
            disabled={notebookPage <= 1 || loading}
            onClick={() => setNotebookPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            aria-label="Previous collections"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <p className="text-[10px] text-[var(--text-muted)] tabular-nums">
            {notebookPage} / {totalNotebookPages}
          </p>
            <button
              type="button"
            disabled={notebookPage >= totalNotebookPages || loading}
            onClick={() =>
              setNotebookPage((p) => Math.min(totalNotebookPages, p + 1))
            }
            className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            aria-label="Next collections"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            </button>
        </div>
      )}
    </aside>
    {editNotebook && (
      <NotebookEditModal
        notebook={editNotebook}
        onClose={() => setEditNotebook(null)}
      />
    )}
    {shareTarget && (
      <SharePageModal
        open
        pageId={shareTarget.id}
        pageTitle={shareTarget.title}
        onClose={() => {
          setShareTarget(null);
          window.dispatchEvent(new Event("shelf:shares-changed"));
        }}
      />
    )}
  </>
  );
}
