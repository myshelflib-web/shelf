"use client";

import { UserSubject, UserPageSummary } from "@/types";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { SharedWithMeSection } from "@/components/my-content/SharedWithMeSection";
import { SharePageModal } from "@/components/my-content/SharePageModal";
import { MyContentExplorerTree } from "@/components/my-content/MyContentExplorerTree";
import { BulkDeleteModal } from "@/components/my-content/BulkDeleteModal";
import {
  buildSelectionLabels,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import { useExplorerMoves } from "@/components/my-content/useExplorerMoves";
import { usePinnedExplorerSubjects } from "@/components/my-content/usePinnedExplorerSubjects";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { useExplorerDeletes } from "@/components/my-content/useExplorerDeletes";
import { api } from "@/lib/api";
import { useScheduledPageHrefs } from "@/hooks/useScheduledPageHrefs";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PersonalPageReaderScope,
  scopeFromHref,
} from "@/components/my-content/reader/types";
import { NotebookEditModal } from "@/components/my-content/NotebookEditModal";
import { getNotebookLastRead, hydrateLastReads } from "@/lib/tabViewState";
import {
  emitContentChanged,
  emitPageRenamed,
} from "@/lib/contentEvents";
import {
  SIDEBAR_NOTEBOOK_PAGE_SIZE,
  useMyContentSidebarLibrary,
} from "@/components/my-content/useMyContentSidebarLibrary";
import { MyContentSidebarTools } from "@/components/my-content/MyContentSidebarTools";
import { LibraryItemSyncProvider } from "@/components/LibraryItemSyncProvider";
import { mergeExplorerSubjectsForDisplay } from "@/lib/mergeExplorerSubjectsForDisplay";
import {
  SIDEBAR_SORT_KEY,
  directionTitle,
  notebookSortFor,
  readSortAscending,
  readSortCriterion,
  writeSortAscending,
  type SortCriterion,
} from "@/lib/myContentSidebarPrefs";

interface MyContentSidebarProps {
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
  const [sortAscending, setSortAscending] = useState(readSortAscending);
  const sort = notebookSortFor(sortCriterion, sortAscending);
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [notebookPage, setNotebookPage] = useState(1);
  const [rootPage, setRootPage] = useState(1);
  const [editNotebook, setEditNotebook] = useState<UserSubject | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<ExplorerSelectionKey>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
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

  const searching = debouncedQ.length > 0;
  const libraryMoveEnabled = !searching && !selectionMode;
  const scheduledHrefs = useScheduledPageHrefs(true);

  const {
    subjects,
    setSubjects,
    rootPages,
    setRootPages,
    pinnedExtra,
    setPinnedExtra,
    totalNotebooks,
    setTotalNotebooks,
    totalNotebookPages,
    loading,
    load,
    hydrateSubject,
    hydratingSlugs,
    isSubjectHydrated,
    markHydrated,
    invalidateHydrate,
  } = useMyContentSidebarLibrary({
    notebookPage,
    sort,
    searching,
    debouncedQ,
    notebookSlug,
    setExpandedNotebooks,
    setExpandedTopics,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 220);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_SORT_KEY, sortCriterion);
    } catch {
      /* ignore */
    }
    writeSortAscending(sortAscending);
  }, [sortCriterion, sortAscending]);

  useEffect(() => {
    setNotebookPage(1);
  }, [sort, debouncedQ]);

  useEffect(() => {
    api.myContent
      .getLastRead()
      .then(hydrateLastReads)
      .catch(() => undefined);
  }, []);

  /** Skip pinned refetch while a move is in flight (avoids clobbering optimistic trees). */
  const treeMutationInFlightRef = useRef(false);

  usePinnedExplorerSubjects({
    subjects,
    notebookSlug,
    setPinnedExtra,
    markHydrated,
    treeMutationInFlightRef,
  });

  useEffect(() => {
    setRootPage(1);
  }, [rootPages.length, debouncedQ]);

  const treeSubjects = useMemo(
    () => mergeExplorerSubjectsForDisplay(subjects, pinnedExtra, notebook),
    [subjects, pinnedExtra, notebook]
  );

  const filteredRootPages = useMemo(() => {
    if (!searching) return rootPages;
    const q = debouncedQ.toLowerCase();
    return rootPages.filter((p) => p.title.toLowerCase().includes(q));
  }, [rootPages, searching, debouncedQ]);

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
    if (willOpen) {
      if (!isSubjectHydrated(slug)) {
        void hydrateSubject(slug);
      }
      if (!workspaceMode) {
        const last = getNotebookLastRead(slug);
        if (last?.href) router.push(last.href);
      }
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
    markHydrated,
    invalidateHydrate,
    treeMutationInFlightRef,
  });

  const isEmpty =
    !loading && treeSubjects.length === 0 && filteredRootPages.length === 0;
  const sortDirTitle = directionTitle(sortCriterion, sortAscending);

  return (
    <LibraryItemSyncProvider>
    <>
    <aside
      className={clsx(
        "w-72 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col h-full overflow-hidden",
        className
      )}
    >
      <MyContentSidebarTools
        libraryModeTabs={libraryModeTabs}
        selectionMode={selectionMode}
        onToggleSelection={() =>
          selectionMode ? exitSelectionMode() : setSelectionMode(true)
        }
        onAddPage={() => openAdd({ kind: "page" })}
        onAddNotebook={() => openAdd({ kind: "notebook" })}
        onRefresh={() => load({ spin: true })}
        loading={loading}
        onCollapseAll={collapseAll}
        workspaceMode={workspaceMode}
        query={query}
        onQueryChange={setQuery}
        sortCriterion={sortCriterion}
        onSortCriterionChange={setSortCriterion}
        sortDirTitle={sortDirTitle}
        sortAscending={sortAscending}
        onToggleSortDirection={() => setSortAscending((v) => !v)}
        libraryMoveEnabled={libraryMoveEnabled}
      />

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
          hydratingSlugs={hydratingSlugs}
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
          onReorderSubjects={() => undefined}
          onReorderTopics={() => undefined}
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
    </LibraryItemSyncProvider>
  );
}
