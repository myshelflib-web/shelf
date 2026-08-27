"use client";

import { UserSubject, UserPageSummary, UserTopicGroup } from "@/types";
import { pageHref } from "@/lib/myContentTree";
import {
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FolderPlus,
} from "lucide-react";
import { ExplorerSidebarSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { ExplorerPageRow } from "@/components/my-content/ExplorerPageRow";
import { ExplorerCollectionBlock } from "@/components/my-content/ExplorerCollectionBlock";
import { ExplorerDropLine } from "@/components/my-content/ExplorerDropLine";
import { useExplorerReorderDrop } from "@/components/my-content/useExplorerReorderDrop";
import type { ExplorerSelectionKey } from "@/lib/explorerSelection";

const SIDEBAR_ROOT_PAGE_SIZE = 12;

interface MyContentExplorerTreeProps {
  loading: boolean;
  isEmpty: boolean;
  searching: boolean;
  debouncedQ: string;
  treeSubjects: UserSubject[];
  filteredRootPages: UserPageSummary[];
  rootPage: number;
  setRootPage: (fn: (p: number) => number) => void;
  totalNotebooks: number;
  notebook?: UserSubject;
  pinnedExtra: UserSubject[];
  notebookSlug?: string;
  currentTopicSlug?: string;
  currentPageSlug?: string;
  currentHref?: string;
  expandedNotebooks: Record<string, boolean>;
  expandedTopics: Record<string, boolean>;
  toggleNotebook: (slug: string) => void;
  toggleTopic: (notebookSlugKey: string, topicSlug: string) => void;
  enablePageDrag: boolean;
  workspaceMode: boolean;
  onOpenPage: (page: UserPageSummary, href: string) => void;
  scheduledHrefs: Set<string>;
  selectionMode: boolean;
  selected: Set<ExplorerSelectionKey>;
  onSelectionChange: (next: Set<ExplorerSelectionKey>) => void;
  reorderEnabled: boolean;
  onReorderSubjects: (orderedIds: string[]) => void | Promise<void>;
  onReorderTopics: (
    subjectId: string,
    orderedIds: string[]
  ) => void | Promise<void>;
  onEditNotebook: (nb: UserSubject) => void;
  onSharePage: (pageId: string, title: string) => void;
  onRenamePage: (pageId: string, title: string) => void | Promise<void>;
  onDeletePage: (pageId: string, title: string) => void | Promise<void>;
  onRenameTopic: (
    nb: UserSubject,
    groupId: string,
    title: string
  ) => void | Promise<void>;
  onDeleteTopic: (
    nb: UserSubject,
    groupId: string,
    title: string
  ) => void | Promise<void>;
  onAddTopic: (nb: UserSubject) => void;
  onAddPage: (nb: UserSubject, topic?: UserTopicGroup) => void;
  openAddPage: () => void;
  openAddNotebook: () => void;
}

export function MyContentExplorerTree(props: MyContentExplorerTreeProps) {
  const {
    loading,
    isEmpty,
    searching,
    debouncedQ,
    treeSubjects,
    filteredRootPages,
    rootPage,
    setRootPage,
    totalNotebooks,
    notebook,
    pinnedExtra,
    notebookSlug,
    currentTopicSlug,
    currentPageSlug,
    currentHref,
    expandedNotebooks,
    expandedTopics,
    toggleNotebook,
    toggleTopic,
    enablePageDrag,
    onOpenPage,
    scheduledHrefs,
    selectionMode,
    selected,
    onSelectionChange,
    reorderEnabled,
    onReorderSubjects,
    onReorderTopics,
    onEditNotebook,
    onSharePage,
    onRenamePage,
    onDeletePage,
    onRenameTopic,
    onDeleteTopic,
    onAddTopic,
    onAddPage,
    openAddPage,
    openAddNotebook,
  } = props;

  const {
    dropHint,
    startReorderDrag,
    allowReorderDrop,
    finishReorderDrop,
    clearDropHint,
  } = useExplorerReorderDrop();

  const rootTotalPages = Math.max(
    1,
    Math.ceil(filteredRootPages.length / SIDEBAR_ROOT_PAGE_SIZE)
  );
  const visibleRootPages = filteredRootPages.slice(
    (rootPage - 1) * SIDEBAR_ROOT_PAGE_SIZE,
    rootPage * SIDEBAR_ROOT_PAGE_SIZE
  );
  const subjectIds = treeSubjects.map((s) => s.id);

  if (loading && treeSubjects.length === 0 && pinnedExtra.length === 0) {
    return <ExplorerSidebarSkeleton />;
  }

  if (isEmpty) {
    return (
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
              onClick={openAddNotebook}
              className="p-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FolderPlus className="w-5 h-5" />
            </button>
            <button
              type="button"
              title="Add page"
              onClick={openAddPage}
              className="p-2 rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FilePlus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
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
              <ExplorerPageRow
                key={page.id}
                page={page}
                href={href}
                isActive={isActive}
                selectionMode={selectionMode}
                selected={selected}
                onSelectionChange={onSelectionChange}
                enablePageDrag={enablePageDrag}
                scheduledHrefs={scheduledHrefs}
                onOpenPage={onOpenPage}
                onSharePage={onSharePage}
                onRenamePage={onRenamePage}
                onDeletePage={onDeletePage}
              />
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
          {treeSubjects.map((nb, nbIndex) => (
            <ExplorerCollectionBlock
              key={nb.id}
              nb={nb}
              nbIndex={nbIndex}
              treeSubjectCount={treeSubjects.length}
              subjectIds={subjectIds}
              open={expandedNotebooks[nb.slug] ?? false}
              isPinned={
                notebook?.id === nb.id || pinnedExtra.some((p) => p.id === nb.id)
              }
              isCurrentNotebook={notebook?.id === nb.id}
              notebookSlug={notebookSlug}
              currentTopicSlug={currentTopicSlug}
              currentPageSlug={currentPageSlug}
              currentHref={currentHref}
              expandedTopics={expandedTopics}
              selectionMode={selectionMode}
              selected={selected}
              onSelectionChange={onSelectionChange}
              reorderEnabled={reorderEnabled}
              searching={searching}
              dropHint={dropHint}
              onToggleNotebook={toggleNotebook}
              onToggleTopic={toggleTopic}
              onEditNotebook={onEditNotebook}
              onAddTopic={onAddTopic}
              onAddPage={onAddPage}
              onRenameTopic={onRenameTopic}
              onDeleteTopic={onDeleteTopic}
              startReorderDrag={startReorderDrag}
              allowReorderDrop={allowReorderDrop}
              finishReorderDrop={finishReorderDrop}
              clearDropHint={clearDropHint}
              onReorderSubjects={onReorderSubjects}
              onReorderTopics={onReorderTopics}
              enablePageDrag={enablePageDrag}
              scheduledHrefs={scheduledHrefs}
              onOpenPage={onOpenPage}
              onSharePage={onSharePage}
              onRenamePage={onRenamePage}
              onDeletePage={onDeletePage}
            />
          ))}
          {reorderEnabled && !selectionMode && !searching && (
            <>
              <ExplorerDropLine
                active={
                  dropHint?.kind === "subject" && dropHint.beforeId === null
                }
              />
              <div
                className="h-2"
                onDragOver={(e) =>
                  allowReorderDrop({ kind: "subject", beforeId: null }, e)
                }
                onDragLeave={clearDropHint}
                onDrop={(e) =>
                  void finishReorderDrop(
                    { kind: "subject", beforeId: null },
                    e,
                    subjectIds,
                    onReorderSubjects
                  )
                }
              />
            </>
          )}
        </div>
      )}
    </>
  );
}
