"use client";

import { NotebookSort, UserSubject, UserPageSummary } from "@/types";
import {
  insertPageInTree,
  insertTopicInTree,
  syncPageInTree,
  syncRootPages,
} from "@/lib/myContentTree";
import {
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Trash2,
  FilePlus,
  FolderPlus,
  RefreshCw,
  FoldVertical,
  Search,
  ArrowDownWideNarrow,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { SharedWithMeSection } from "@/components/my-content/SharedWithMeSection";
import { SharePageModal } from "@/components/my-content/SharePageModal";
import { MyContentExplorerTree } from "@/components/my-content/MyContentExplorerTree";
import { BulkDeleteModal } from "@/components/my-content/BulkDeleteModal";
import {
  buildBulkDeletePayload,
  buildSelectionLabels,
  pageSelectionKey,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import { applyBulkDeleteToTree } from "@/lib/explorerBulkDeleteTree";
import {
  mergeExplorerTreeWithPending,
  applyPendingDeletesToSubjects,
} from "@/lib/pendingExplorerDeletes";
import { useExplorerMoves } from "@/components/my-content/useExplorerMoves";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { useExplorerDeletes } from "@/components/my-content/useExplorerDeletes";
import { listSubjects } from "@/lib/offline/library";
import { api } from "@/lib/api";
import { listTasks } from "@/lib/offline/tasks";
import { useScheduledPageHrefs } from "@/hooks/useScheduledPageHrefs";
import clsx from "clsx";
import { withShortcut } from "@/lib/hotkeys";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PersonalPageReaderScope,
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
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { shelfSelectSidebarClass } from "@/lib/ui/fieldClasses";

const SIDEBAR_NOTEBOOK_PAGE_SIZE = 15;
const PINNED_KEY = "shelf:explorer-pinned";
const SORT_KEY = "shelf:explorer-sort";
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

function readSortCriterion(): SortCriterion {
  if (typeof window === "undefined") return "activity";
  try {
    const raw = localStorage.getItem(SORT_KEY);
    if (raw === "activity" || raw === "name") return raw;
    if (raw === "manual") return "activity";
  } catch {
    /* ignore */
  }
  return "activity";
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

  const [sortCriterion, setSortCriterion] = useState<SortCriterion>(readSortCriterion);
  const [sortAscending, setSortAscending] = useState(false);
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<ExplorerSelectionKey>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const searching = debouncedQ.length > 0;
  const libraryMoveEnabled = !searching && !selectionMode;
  const scheduledHrefs = useScheduledPageHrefs(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 220);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_KEY, sortCriterion);
    } catch {
      /* ignore */
    }
  }, [sortCriterion]);

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
    const pageSize = SIDEBAR_NOTEBOOK_PAGE_SIZE;
    listSubjects({
        page: searching ? 1 : notebookPage,
        pageSize,
        sort,
        q: searching ? debouncedQ : undefined,
      })
      .then((res) => {
        const merged = mergeExplorerTreeWithPending(
          res.subjects,
          res.rootPages ?? []
        );
        setSubjects(merged.subjects);
        setRootPages(merged.rootPages);
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
          insertTopicInTree(
            prev,
            change.notebookId,
            change.topicGroup,
            change.parentTopicId
          )
        );
        setPinnedExtra((prev) =>
          insertTopicInTree(
            prev,
            change.notebookId,
            change.topicGroup,
            change.parentTopicId
          )
        );
        setExpandedNotebooks((prev) => ({
          ...prev,
          [change.notebookSlug]: true,
        }));
        if (change.parentTopicSlug) {
          const tKey = `${change.notebookSlug}:${change.parentTopicSlug}`;
          setExpandedTopics((prev) => ({ ...prev, [tKey]: true }));
        }
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
      } else if (change?.type === "page-deleted") {
        const payload = buildBulkDeletePayload(
          new Set([pageSelectionKey(change.pageId)])
        );
        setSubjects((s) => applyBulkDeleteToTree(payload, s, []).subjects);
        setPinnedExtra((p) =>
          applyBulkDeleteToTree(payload, p, []).subjects
        );
        setRootPages((r) =>
          applyBulkDeleteToTree(payload, [], r).rootPages
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
      setPinnedExtra(
        applyPendingDeletesToSubjects(
          rows.filter((r): r is UserSubject => r != null)
        )
      );
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
    const pendingMerged = applyPendingDeletesToSubjects([
      ...pinnedExtra,
      ...subjects,
      ...(notebook ? [notebook] : []),
    ]);
    for (const nb of pendingMerged) {
      if (!byId.has(nb.id)) byId.set(nb.id, nb);
    }
    return [...byId.values()];
  }, [subjects, pinnedExtra, notebook]);

  const filteredRootPages = useMemo(() => {
    if (!searching) return rootPages;
    const q = debouncedQ.toLowerCase();
    return rootPages.filter((p) => p.title.toLowerCase().includes(q));
  }, [rootPages, searching, debouncedQ]);

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

  const selectionLabels = useMemo(
    () => buildSelectionLabels(treeSubjects, filteredRootPages),
    [treeSubjects, filteredRootPages]
  );

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelected(new Set());
    setBulkDeleteOpen(false);
  }, []);

  const { deleteTopic, deletePage, handleBulkDelete } = useExplorerDeletes({
    setSubjects,
    setPinnedExtra,
    setRootPages,
    workspaceMode,
    navigateHome: () => router.push("/my-content"),
    selected,
    exitSelectionMode,
  });

  const { handleMovePage, handleMoveTopic } = useExplorerMoves({
    subjects,
    pinnedExtra,
    rootPages,
    treeSubjects,
    setSubjects,
    setPinnedExtra,
    setRootPages,
    setExpandedNotebooks,
    setExpandedTopics,
  });

  const handleReorderSubjects = (_orderedIds: string[]) => {
    /* Top-level folder order is controlled by Sort by only — no manual reorder. */
  };

  const handleReorderTopics = (_subjectId: string, _orderedIds: string[]) => {
    /* Nested folder order within a parent is not user-sorted — use move between folders. */
  };

  const isEmpty =
    !loading && treeSubjects.length === 0 && filteredRootPages.length === 0;

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
              title={selectionMode ? "Exit selection mode" : "Select items to delete"}
              aria-label={selectionMode ? "Exit selection mode" : "Select items"}
              onClick={() =>
                selectionMode ? exitSelectionMode() : setSelectionMode(true)
              }
              className={clsx(
                "p-1.5 rounded-md hover:bg-[var(--bg-elevated)]",
                selectionMode
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {selectionMode ? (
                <XSquare className="w-4 h-4" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              title={withShortcut("Add a file to your library", "c p")}
              aria-label="Add file"
              onClick={() => openAdd({ kind: "page" })}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FilePlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              title={withShortcut("Create a new folder", "c n")}
              aria-label="New folder"
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
              title="Collapse all folders"
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
              placeholder="Search folders…"
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>
        )}

        <div className="px-0.5 pt-0.5">
          <p className="text-[9.5px] uppercase tracking-[0.05em] font-bold text-[var(--text-muted)] px-1 mb-1.5">
            Sort by
          </p>
          <div className="flex items-center gap-1.5">
            <ShelfSelect
              compact
              className={`flex-1 min-w-0 ${shelfSelectSidebarClass}`}
              value={sortCriterion}
              aria-label="Sort folders"
              options={SORT_CRITERIA.map((s) => ({ value: s.id, label: s.label }))}
              onChange={(v) => setSortCriterion(v as SortCriterion)}
            />
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
          {libraryMoveEnabled && (
            <p className="text-[10px] text-[var(--text-muted)] px-1 mt-1.5 leading-snug">
              Drag a file or folder to move it into another folder.
            </p>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2">
        <MyContentExplorerTree
          loading={loading}
          isEmpty={isEmpty}
          searching={searching}
          debouncedQ={debouncedQ}
          treeSubjects={treeSubjects}
          filteredRootPages={filteredRootPages}
          rootPage={rootPage}
          setRootPage={setRootPage}
          totalNotebooks={totalNotebooks}
          notebook={notebook}
          pinnedExtra={pinnedExtra}
          notebookSlug={notebookSlug}
          currentTopicSlug={currentTopicSlug}
          currentPageSlug={currentPageSlug}
          currentHref={currentHref}
          expandedNotebooks={expandedNotebooks}
          expandedTopics={expandedTopics}
          toggleNotebook={toggleNotebook}
          toggleTopic={toggleTopic}
          enablePageDrag={enablePageDrag}
          workspaceMode={workspaceMode}
          onOpenPage={openPage}
          scheduledHrefs={scheduledHrefs}
          selectionMode={selectionMode}
          selected={selected}
          onSelectionChange={setSelected}
          libraryMoveEnabled={libraryMoveEnabled}
          onReorderSubjects={handleReorderSubjects}
          onReorderTopics={handleReorderTopics}
          onMovePage={handleMovePage}
          onMoveTopic={handleMoveTopic}
          onEditNotebook={setEditNotebook}
          onSharePage={(id, title) => setShareTarget({ id, title })}
          onRenamePage={renamePage}
          onDeletePage={deletePage}
          onRenameTopic={renameTopic}
          onDeleteTopic={deleteTopic}
          onAddTopic={(nb) => openAdd({ kind: "topic", notebook: nb })}
          onAddPage={(nb, topic) =>
            openAdd({ kind: "page", notebook: nb, topic })
          }
          onAddNestedFolder={(nb, parentTopic) =>
            openAdd({ kind: "topic", notebook: nb, topic: parentTopic })
          }
          openAddPage={() => openAdd({ kind: "page" })}
          openAddNotebook={() => openAdd({ kind: "notebook" })}
        />
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

      {selectionMode && selected.size > 0 && (
        <div className="px-2 py-2 border-t border-[var(--border)] shrink-0 flex items-center gap-2">
          <p className="text-[11px] text-[var(--text-muted)] flex-1 min-w-0">
            {selected.size} selected
          </p>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-600 text-white hover:bg-red-500"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}

      {!searching && totalNotebookPages > 1 && (
        <div className="px-2 py-1.5 border-t border-[var(--border)] flex items-center justify-between gap-1 shrink-0">
          <button
            type="button"
            disabled={notebookPage <= 1 || loading}
            onClick={() => setNotebookPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] disabled:opacity-30"
            aria-label="Previous folders"
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
            aria-label="Next folders"
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
    <BulkDeleteModal
      open={bulkDeleteOpen}
      selected={selected}
      labels={selectionLabels}
      deleting={false}
      onClose={() => setBulkDeleteOpen(false)}
      onConfirm={handleBulkDelete}
    />
  </>
  );
}
