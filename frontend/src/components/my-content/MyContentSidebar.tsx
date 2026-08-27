"use client";

import { NotebookSort, UserSubject, UserPageSummary } from "@/types";
import {
  insertPageInTree,
  insertTopicInTree,
  syncPageInTree,
  syncRootPages,
} from "@/lib/myContentTree";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Check,
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
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import { applyBulkDeleteToTree } from "@/lib/explorerBulkDeleteTree";
import {
  patchSubjectsOrder,
} from "@/lib/libraryReorder";
import {
  findTopicLocation,
  movePageInTree,
  moveTopicInTree,
} from "@/lib/libraryMove";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { listSubjects } from "@/lib/offline/library";
import { api } from "@/lib/api";
import { listTasks } from "@/lib/offline/tasks";
import { useScheduledPageHrefs } from "@/hooks/useScheduledPageHrefs";
import clsx from "clsx";
import { withShortcut } from "@/lib/hotkeys";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAppDialog } from "@/hooks/useAppDialog";
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

const SIDEBAR_NOTEBOOK_PAGE_SIZE = 15;
const SIDEBAR_MANUAL_ORDER_PAGE_SIZE = 200;
const PINNED_KEY = "shelf:explorer-pinned";
const SORT_KEY = "shelf:explorer-sort";
const MAX_PINNED = 5;

type SortCriterion = "activity" | "name" | "manual";

const SORT_CRITERIA: { id: SortCriterion; label: string }[] = [
  { id: "activity", label: "Last activity" },
  { id: "name", label: "Name" },
  { id: "manual", label: "Manual order" },
];

function notebookSortFor(
  criterion: SortCriterion,
  ascending: boolean
): NotebookSort {
  if (criterion === "manual") return "order";
  if (criterion === "name") return ascending ? "name" : "nameDesc";
  return ascending ? "oldest" : "recent";
}

function directionTitle(criterion: SortCriterion, ascending: boolean): string {
  if (criterion === "manual") {
    return "Drag collections to reorder";
  }
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
    if (raw === "activity" || raw === "name" || raw === "manual") return raw;
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
  const { confirm } = useAppDialog();
  const router = useRouter();

  const [sortCriterion, setSortCriterion] = useState<SortCriterion>(readSortCriterion);
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<ExplorerSelectionKey>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const searching = debouncedQ.length > 0;
  const manualOrder = sortCriterion === "manual";
  const reorderEnabled = manualOrder && !searching;
  const showDragAffordance = !searching && !selectionMode;
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
    if (sortCriterion === "manual" && selectionMode) {
      setSelectionMode(false);
      setSelected(new Set());
    }
  }, [sortCriterion, selectionMode]);

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
    const pageSize = manualOrder
      ? SIDEBAR_MANUAL_ORDER_PAGE_SIZE
      : SIDEBAR_NOTEBOOK_PAGE_SIZE;
    listSubjects({
        page: searching ? 1 : notebookPage,
        pageSize,
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
  }, [notebookPage, sort, searching, debouncedQ, manualOrder]);

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
    const ok = await confirm({
      title: "Delete topic",
      message: `Delete topic "${title}" and its pages? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await api.myContent.deleteTopicGroup(nb.id, groupId);
    emitContentChanged();
  };

  const deletePage = async (pageId: string, title: string) => {
    const ok = await confirm({
      title: "Delete page",
      message: `Delete page "${title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
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

  const selectionLabels = useMemo(
    () => buildSelectionLabels(treeSubjects, filteredRootPages),
    [treeSubjects, filteredRootPages]
  );

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelected(new Set());
    setBulkDeleteOpen(false);
  };

  const handleBulkDelete = () => {
    const payload = buildBulkDeletePayload(selected);
    const prevSubjects = subjects;
    const prevPinned = pinnedExtra;
    const prevRootPages = rootPages;

    setSubjects((s) => applyBulkDeleteToTree(payload, s, rootPages).subjects);
    setPinnedExtra((p) => applyBulkDeleteToTree(payload, p, rootPages).subjects);
    setRootPages((r) => applyBulkDeleteToTree(payload, subjects, r).rootPages);
    exitSelectionMode();

    void api.myContent.bulkDelete(payload).catch(() => {
      setSubjects(prevSubjects);
      setPinnedExtra(prevPinned);
      setRootPages(prevRootPages);
      emitContentChanged();
    });
  };

  const handleReorderSubjects = (orderedIds: string[]) => {
    void api.myContent
      .reorderSubjects(orderedIds)
      .finally(() => load({ silent: true }));
  };

  const handleReorderTopics = (subjectId: string, orderedIds: string[]) => {
    const prevSubjects = subjects;
    const prevPinned = pinnedExtra;
    setSubjects((s) => patchSubjectsOrder(s, subjectId, orderedIds));
    setPinnedExtra((s) => patchSubjectsOrder(s, subjectId, orderedIds));
    void api.myContent.reorderTopicGroups(subjectId, orderedIds).catch(() => {
      setSubjects(prevSubjects);
      setPinnedExtra(prevPinned);
    });
  };

  const findPageSummary = (pageId: string): UserPageSummary | null => {
    for (const page of rootPages) {
      if (page.id === pageId) return page;
    }
    for (const subject of treeSubjects) {
      for (const page of subject.pages ?? []) {
        if (page.id === pageId) return page;
      }
      for (const group of subject.topicGroups ?? []) {
        for (const page of group.pages) {
          if (page.id === pageId) return page;
        }
      }
    }
    return null;
  };

  const handleMovePage = (payload: {
    pageId: string;
    subjectId: string | null;
    topicGroupId: string | null;
    beforePageId: string | null;
  }) => {
    const page = findPageSummary(payload.pageId);
    if (!page) return;

    const prevSubjects = subjects;
    const prevPinned = pinnedExtra;
    const prevRoot = rootPages;

    const combined: UserSubject[] = [...subjects];
    for (const extra of pinnedExtra) {
      if (!combined.some((s) => s.id === extra.id)) combined.push(extra);
    }

    const next = movePageInTree(combined, rootPages, payload.pageId, {
      ...payload,
      page,
    });

    setRootPages(next.rootPages);
    setSubjects((prev) =>
      prev.map((s) => next.subjects.find((n) => n.id === s.id) ?? s)
    );
    setPinnedExtra((prev) =>
      prev.map((s) => next.subjects.find((n) => n.id === s.id) ?? s)
    );

    if (payload.subjectId) {
      const target = next.subjects.find((s) => s.id === payload.subjectId);
      if (target) {
        setExpandedNotebooks((prev) => ({ ...prev, [target.slug]: true }));
        if (payload.topicGroupId) {
          const group = target.topicGroups?.find((g) => g.id === payload.topicGroupId);
          if (group) {
            setExpandedTopics((prev) => ({
              ...prev,
              [`${target.slug}:${group.slug}`]: true,
            }));
          }
        }
      }
    }

    void api.myContent
      .movePage(payload.pageId, {
        subjectId: payload.subjectId,
        topicGroupId: payload.topicGroupId,
        beforePageId: payload.beforePageId,
      })
      .catch(() => {
        setSubjects(prevSubjects);
        setPinnedExtra(prevPinned);
        setRootPages(prevRoot);
      })
      .then(() => emitContentChanged());
  };

  const handleMoveTopic = (payload: {
    groupId: string;
    sourceSubjectId: string;
    targetSubjectId: string;
    beforeGroupId: string | null;
  }) => {
    const loc =
      findTopicLocation(treeSubjects, payload.groupId) ??
      findTopicLocation(pinnedExtra, payload.groupId);
    if (!loc) return;

    const prevSubjects = subjects;
    const prevPinned = pinnedExtra;

    const applyMove = (list: UserSubject[]) =>
      moveTopicInTree(
        list,
        payload.groupId,
        payload.targetSubjectId,
        loc.group,
        payload.beforeGroupId
      );

    setSubjects(applyMove);
    setPinnedExtra(applyMove);

    const target = treeSubjects.find((s) => s.id === payload.targetSubjectId);
    if (target) {
      setExpandedNotebooks((prev) => ({ ...prev, [target.slug]: true }));
    }

    void api.myContent
      .moveTopicGroup(payload.sourceSubjectId, payload.groupId, {
        targetSubjectId: payload.targetSubjectId,
        beforeGroupId: payload.beforeGroupId,
      })
      .catch(() => {
        setSubjects(prevSubjects);
        setPinnedExtra(prevPinned);
      })
      .then(() => emitContentChanged());
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
              disabled={manualOrder}
              onClick={() => setSortAscending((v) => !v)}
              className="w-[34px] h-[34px] shrink-0 grid place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ArrowDownWideNarrow
                className={clsx(
                  "w-4 h-4 transition-transform duration-150",
                  sortAscending && "scale-y-[-1]"
                )}
              />
            </button>
          </div>
          {manualOrder && !searching && (
            <p className="text-[10px] text-[var(--text-muted)] px-1 mt-1.5 leading-snug">
              Drag the{" "}
              <span className="inline-flex align-middle text-[var(--text-secondary)]">
                ⋮⋮
              </span>{" "}
              handle (hover a row) to reorder, or drop pages and topics into another collection.
            </p>
          )}
          {!manualOrder && !searching && (
            <p className="text-[10px] text-[var(--text-muted)] px-1 mt-1.5 leading-snug">
              Set Sort by to{" "}
              <button
                type="button"
                onClick={() => setSortCriterion("manual")}
                className="text-[var(--accent)] hover:underline font-medium"
              >
                Manual order
              </button>{" "}
              to show drag handles (
              <span className="inline-flex align-middle text-[var(--text-muted)]/70">
                ⋮⋮
              </span>
              ) on each row when you hover it.
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
          reorderEnabled={reorderEnabled}
          showDragAffordance={showDragAffordance}
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

      {!searching && !manualOrder && totalNotebookPages > 1 && (
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
