"use client";

import { UserSubject, UserTopicGroup } from "@/types";
import {
  getNotebookPages,
  getTopicGroups,
  pageHref,
} from "@/lib/myContentTree";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Trash2,
  FilePlus,
  FolderPlus,
  Pencil,
} from "lucide-react";
import { ExplorerDragGrip } from "@/components/my-content/ExplorerDragGrip";
import { FolderMark } from "@/components/FolderMark";
import { folderTone } from "@/lib/folderTone";
import { ExplorerPageRow } from "@/components/my-content/ExplorerPageRow";
import { ExplorerSelectionToggle } from "@/components/my-content/ExplorerSelectionToggle";
import { ExplorerDropLine } from "@/components/my-content/ExplorerDropLine";
import {
  type ExplorerDropHint,
} from "@/components/my-content/useExplorerReorderDrop";
import clsx from "clsx";
import type { DragEvent } from "react";
import {
  subjectSelectionKey,
  topicSelectionKey,
  toggleSelectionKey,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import type { ReorderDragPayload } from "@/lib/libraryReorder";
import type { UserPageSummary } from "@/types";
import { useAppDialog } from "@/hooks/useAppDialog";

interface ExplorerCollectionBlockProps {
  nb: UserSubject;
  open: boolean;
  isPinned: boolean;
  isCurrentNotebook: boolean;
  notebookSlug?: string;
  currentTopicSlug?: string;
  currentPageSlug?: string;
  currentHref?: string;
  expandedTopics: Record<string, boolean>;
  selectionMode: boolean;
  selected: Set<ExplorerSelectionKey>;
  onSelectionChange: (next: Set<ExplorerSelectionKey>) => void;
  libraryMoveEnabled: boolean;
  searching: boolean;
  dropHint: ExplorerDropHint | null;
  activeDrag: ReorderDragPayload | null;
  onToggleNotebook: (slug: string) => void;
  onToggleTopic: (notebookSlug: string, topicSlug: string) => void;
  onEditNotebook: (nb: UserSubject) => void;
  onAddTopic: (nb: UserSubject) => void;
  onAddPage: (nb: UserSubject, topic?: UserTopicGroup) => void;
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
  startReorderDrag: (payload: ReorderDragPayload, e: DragEvent) => void;
  allowReorderDrop: (hint: ExplorerDropHint, e: DragEvent) => void;
  finishReorderDrop: (
    hint: ExplorerDropHint,
    e: DragEvent,
    context: {
      subjectIds?: string[];
      topicIds?: string[];
      pageIds?: string[];
    }
  ) => void | Promise<void>;
  clearDropHint: () => void;
  enablePageDrag: boolean;
  scheduledHrefs: Set<string>;
  onOpenPage: (page: UserPageSummary, href: string) => void;
  onSharePage: (pageId: string, title: string) => void;
  onRenamePage: (pageId: string, title: string) => void | Promise<void>;
  onDeletePage: (pageId: string, title: string) => void | Promise<void>;
}

export function ExplorerCollectionBlock({
  nb,
  open,
  isPinned,
  isCurrentNotebook,
  notebookSlug,
  currentTopicSlug,
  currentPageSlug,
  currentHref,
  expandedTopics,
  selectionMode,
  selected,
  onSelectionChange,
  libraryMoveEnabled,
  searching,
  dropHint,
  activeDrag,
  onToggleNotebook,
  onToggleTopic,
  onEditNotebook,
  onAddTopic,
  onAddPage,
  onRenameTopic,
  onDeleteTopic,
  startReorderDrag,
  allowReorderDrop,
  finishReorderDrop,
  clearDropHint,
  enablePageDrag,
  scheduledHrefs,
  onOpenPage,
  onSharePage,
  onRenamePage,
  onDeletePage,
}: ExplorerCollectionBlockProps) {
  const { prompt } = useAppDialog();
  const loose = getNotebookPages(nb);
  const groups = getTopicGroups(nb);
  const subjectKey = subjectSelectionKey(nb.id);
  const looseIds = loose.map((p) => p.id);

  const toggleSubject = () =>
    onSelectionChange(toggleSelectionKey(selected, subjectKey));

  const showSubjectRowDrop =
    libraryMoveEnabled &&
    !selectionMode &&
    !searching &&
    dropHint?.kind === "subject-row" &&
    dropHint.subjectId === nb.id;

  return (
    <div className="mb-0.5">
      <div
        role="button"
        tabIndex={0}
        onClick={() => (selectionMode ? toggleSubject() : onToggleNotebook(nb.slug))}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectionMode ? toggleSubject() : onToggleNotebook(nb.slug);
          }
        }}
        onDragOver={
          libraryMoveEnabled && !selectionMode && !searching
            ? (e) => {
                if (activeDrag?.kind === "page" || activeDrag?.kind === "topic") {
                  allowReorderDrop({ kind: "subject-row", subjectId: nb.id }, e);
                }
              }
            : undefined
        }
        onDragLeave={clearDropHint}
        onDrop={
          libraryMoveEnabled && !selectionMode && !searching
            ? (e) => {
                void finishReorderDrop(
                  { kind: "subject-row", subjectId: nb.id },
                  e,
                  {}
                );
              }
            : undefined
        }
        className={clsx(
          "group flex items-center gap-0.5 px-1.5 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-elevated)]",
          isPinned && isCurrentNotebook ? "bg-[var(--bg-elevated)]/60" : "",
          showSubjectRowDrop && "ring-1 ring-[var(--accent)]/50 bg-[var(--accent-subtle)]"
        )}
      >
        {selectionMode ? (
          <ExplorerSelectionToggle
            checked={selected.has(subjectKey)}
            onToggle={toggleSubject}
          />
        ) : (
          <span className="w-[18px] shrink-0" aria-hidden />
        )}
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
        {!selectionMode && (
          <span
            className={clsx(
              "flex items-center shrink-0 transition-opacity",
              isCurrentNotebook ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              title="Edit folder"
              onClick={() => onEditNotebook(nb)}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              title="New folder"
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              onClick={() => onAddTopic(nb)}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Add file"
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              onClick={() => onAddPage(nb)}
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
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
              <ExplorerPageRow
                key={page.id}
                page={page}
                href={href}
                isActive={isActive}
                selectionMode={selectionMode}
                selected={selected}
                onSelectionChange={onSelectionChange}
                enablePageDrag={enablePageDrag}
                libraryMoveEnabled={libraryMoveEnabled && !searching}
                subjectId={nb.id}
                topicGroupId={null}
                showPageDrop={false}
                pageIds={looseIds}
                dropHint={dropHint}
                startReorderDrag={startReorderDrag}
                allowReorderDrop={allowReorderDrop}
                finishReorderDrop={finishReorderDrop}
                clearDropHint={clearDropHint}
                scheduledHrefs={scheduledHrefs}
                onOpenPage={onOpenPage}
                onSharePage={onSharePage}
                onRenamePage={onRenamePage}
                onDeletePage={onDeletePage}
              />
            );
          })}
          {libraryMoveEnabled && !selectionMode && loose.length > 0 && (
            <>
              <ExplorerDropLine
                active={
                  dropHint?.kind === "page-notebook" &&
                  dropHint.subjectId === nb.id &&
                  dropHint.beforePageId === null
                }
              />
              <div
                className="h-1"
                onDragOver={(e) =>
                  allowReorderDrop(
                    {
                      kind: "page-notebook",
                      subjectId: nb.id,
                      beforePageId: null,
                    },
                    e
                  )
                }
                onDragLeave={clearDropHint}
                onDrop={(e) =>
                  void finishReorderDrop(
                    {
                      kind: "page-notebook",
                      subjectId: nb.id,
                      beforePageId: null,
                    },
                    e,
                    { pageIds: looseIds }
                  )
                }
              />
            </>
          )}
          {groups.map((group) => {
            const tKey = `${nb.slug}:${group.slug}`;
            const tOpen = expandedTopics[tKey] ?? false;
            const tone = folderTone(group.id);
            const topicKey = topicSelectionKey(nb.id, group.id);
            const toggleTopicSelect = () =>
              onSelectionChange(toggleSelectionKey(selected, topicKey));
            const showTopicRowDrop =
              libraryMoveEnabled &&
              !selectionMode &&
              dropHint?.kind === "topic-row" &&
              dropHint.subjectId === nb.id &&
              dropHint.topicGroupId === group.id;
            const topicPageIds = group.pages.map((p) => p.id);

            return (
              <div key={group.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    selectionMode
                      ? toggleTopicSelect()
                      : onToggleTopic(nb.slug, group.slug)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectionMode
                        ? toggleTopicSelect()
                        : onToggleTopic(nb.slug, group.slug);
                    }
                  }}
                  onDragOver={
                    libraryMoveEnabled && !selectionMode
                      ? (e) => {
                          if (activeDrag?.kind === "page") {
                            allowReorderDrop(
                              {
                                kind: "topic-row",
                                subjectId: nb.id,
                                topicGroupId: group.id,
                              },
                              e
                            );
                          }
                        }
                      : undefined
                  }
                  onDragLeave={clearDropHint}
                  onDrop={
                    libraryMoveEnabled && !selectionMode
                      ? (e) => {
                          if (activeDrag?.kind === "page") {
                            void finishReorderDrop(
                              {
                                kind: "topic-row",
                                subjectId: nb.id,
                                topicGroupId: group.id,
                              },
                              e,
                              {}
                            );
                          }
                        }
                      : undefined
                  }
                  className={clsx(
                    "group flex items-center gap-0.5 px-1 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-elevated)]",
                    showTopicRowDrop &&
                      "ring-1 ring-[var(--accent)]/50 bg-[var(--accent-subtle)]"
                  )}
                >
                  {selectionMode ? (
                    <ExplorerSelectionToggle
                      checked={selected.has(topicKey)}
                      onToggle={toggleTopicSelect}
                    />
                  ) : (
                    <ExplorerDragGrip
                      active={libraryMoveEnabled}
                      label="Drag to move folder"
                      onDragStart={(e) =>
                        startReorderDrag(
                          { kind: "topic", id: group.id, subjectId: nb.id },
                          e
                        )
                      }
                      onDragEnd={clearDropHint}
                    />
                  )}
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
                  {!selectionMode && (
                    <span
                      className="flex items-center shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        title="Rename folder"
                        onClick={async () => {
                          const title = await prompt({
                            title: "Rename folder",
                            defaultValue: group.title,
                            confirmLabel: "Rename",
                          });
                          if (!title || title === group.title) return;
                          await onRenameTopic(nb, group.id, title);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        title="Add file"
                        className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                        onClick={() => onAddPage(nb, group)}
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)]"
                        title="Delete folder"
                        onClick={() => onDeleteTopic(nb, group.id, group.title)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
                {tOpen && (
                  <div className="ml-3 space-y-0.5 mt-0.5">
                    {group.pages.map((page) => {
                      const href = pageHref(nb.slug, group.slug, page.slug);
                      const isActive =
                        currentHref === href ||
                        (notebookSlug === nb.slug &&
                          currentTopicSlug === group.slug &&
                          currentPageSlug === page.slug);
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
                          libraryMoveEnabled={libraryMoveEnabled}
                          subjectId={nb.id}
                          topicGroupId={group.id}
                          showPageDrop={false}
                          pageIds={topicPageIds}
                          dropHint={dropHint}
                          startReorderDrag={startReorderDrag}
                          allowReorderDrop={allowReorderDrop}
                          finishReorderDrop={finishReorderDrop}
                          clearDropHint={clearDropHint}
                          scheduledHrefs={scheduledHrefs}
                          onOpenPage={onOpenPage}
                          onSharePage={onSharePage}
                          onRenamePage={onRenamePage}
                          onDeletePage={onDeletePage}
                        />
                      );
                    })}
                    {libraryMoveEnabled && !selectionMode && group.pages.length > 0 && (
                      <>
                        <ExplorerDropLine
                          active={
                            dropHint?.kind === "page-topic" &&
                            dropHint.subjectId === nb.id &&
                            dropHint.topicGroupId === group.id &&
                            dropHint.beforePageId === null
                          }
                        />
                        <div
                          className="h-1"
                          onDragOver={(e) =>
                            allowReorderDrop(
                              {
                                kind: "page-topic",
                                subjectId: nb.id,
                                topicGroupId: group.id,
                                beforePageId: null,
                              },
                              e
                            )
                          }
                          onDragLeave={clearDropHint}
                          onDrop={(e) =>
                            void finishReorderDrop(
                              {
                                kind: "page-topic",
                                subjectId: nb.id,
                                topicGroupId: group.id,
                                beforePageId: null,
                              },
                              e,
                              { pageIds: topicPageIds }
                            )
                          }
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
