"use client";

import { useRef } from "react";
import { UserSubject, UserTopicGroup, UserPageSummary } from "@/types";
import { getTopicChildren, pageHref } from "@/lib/myContentTree";
import { MAX_FOLDER_DEPTH } from "@/lib/folderDepth";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  FilePlus,
  FolderPlus,
  Pencil,
  Loader2,
} from "lucide-react";
import { FolderMark } from "@/components/FolderMark";
import { ExplorerPageRow } from "@/components/my-content/ExplorerPageRow";
import { ExplorerSelectionToggle } from "@/components/my-content/ExplorerSelectionToggle";
import type { ExplorerDropHint } from "@/components/my-content/useExplorerReorderDrop";
import clsx from "clsx";
import type { DragEvent } from "react";
import {
  topicSelectionKey,
  toggleSelectionKey,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import type { ReorderDragPayload } from "@/lib/libraryReorder";
import { useAppDialog } from "@/hooks/useAppDialog";
import { useDeleteProgressOptional } from "@/components/DeleteProgressProvider";
import { relatedStillInside } from "@/components/my-content/explorerRowDrag";

type ExplorerTopicBlockProps = {
  nb: UserSubject;
  group: UserTopicGroup;
  parentId: string;
  /** Folder depth (collection root = 1, first nested = 2). */
  depth: number;
  tOpen: boolean;
  selectionMode: boolean;
  selected: Set<ExplorerSelectionKey>;
  onSelectionChange: (next: Set<ExplorerSelectionKey>) => void;
  libraryMoveEnabled: boolean;
  activeDrag: ReorderDragPayload | null;
  getActiveDrag: () => ReorderDragPayload | null;
  dropHint: ExplorerDropHint | null;
  startReorderDrag: (payload: ReorderDragPayload, e: DragEvent) => void;
  allowReorderDrop: (hint: ExplorerDropHint, e: DragEvent) => void;
  finishReorderDrop: (
    hint: ExplorerDropHint,
    e: DragEvent,
    context: { pageIds?: string[] }
  ) => void | Promise<void>;
  clearDropHint: () => void;
  clearActiveDrag: () => void;
  onToggleTopic: (notebookSlug: string, topicSlug: string) => void;
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
  onAddPage: (nb: UserSubject, topic?: UserTopicGroup) => void;
  onAddNestedFolder: (nb: UserSubject, parent: UserTopicGroup) => void;
  enablePageDrag: boolean;
  scheduledHrefs: Set<string>;
  onOpenPage: (page: UserPageSummary, href: string) => void;
  onSharePage: (pageId: string, title: string) => void;
  onRenamePage: (pageId: string, title: string) => void | Promise<void>;
  onDeletePage: (pageId: string, title: string) => void | Promise<void>;
  notebookSlug?: string;
  currentTopicSlug?: string;
  currentPageSlug?: string;
  currentHref?: string;
  expandedTopics: Record<string, boolean>;
};

export function ExplorerTopicBlock({
  nb,
  group,
  parentId,
  depth,
  tOpen,
  selectionMode,
  selected,
  onSelectionChange,
  libraryMoveEnabled,
  activeDrag,
  getActiveDrag,
  dropHint,
  startReorderDrag,
  allowReorderDrop,
  finishReorderDrop,
  clearDropHint,
  clearActiveDrag,
  onToggleTopic,
  onRenameTopic,
  onDeleteTopic,
  onAddPage,
  onAddNestedFolder,
  enablePageDrag,
  scheduledHrefs,
  onOpenPage,
  onSharePage,
  onRenamePage,
  onDeletePage,
  notebookSlug,
  currentTopicSlug,
  currentPageSlug,
  currentHref,
  expandedTopics,
}: ExplorerTopicBlockProps) {
  const { prompt } = useAppDialog();
  const suppressClickRef = useRef(false);
  const topicKey = topicSelectionKey(nb.id, group.id);
  const topicDeleting = Boolean(
    useDeleteProgressOptional()?.deletingKeys.has(topicKey)
  );
  const toggleTopicSelect = () =>
    onSelectionChange(toggleSelectionKey(selected, topicKey));
  const canMove = libraryMoveEnabled && !selectionMode;
  const dragging = activeDrag?.kind === "topic" && activeDrag.id === group.id;
  const showTopicRowDrop =
    canMove &&
    dropHint?.kind === "topic-row" &&
    dropHint.subjectId === nb.id &&
    dropHint.topicGroupId === group.id;
  const topicPageIds = group.pages.map((p) => p.id);
  const children = getTopicChildren(group);
  const canNest = depth < MAX_FOLDER_DEPTH;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        draggable={canMove}
        title={canMove ? `${group.title} — drag to move` : group.title}
        onDragStart={(e) => {
          if (!canMove || topicDeleting) {
            e.preventDefault();
            return;
          }
          suppressClickRef.current = false;
          startReorderDrag(
            {
              kind: "topic",
              id: group.id,
              subjectId: nb.id,
              topicGroupId: parentId,
            },
            e
          );
        }}
        onDragEnd={() => {
          if (canMove) suppressClickRef.current = true;
          clearActiveDrag();
        }}
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (topicDeleting) return;
          selectionMode
            ? toggleTopicSelect()
            : onToggleTopic(nb.slug, group.slug);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (topicDeleting) return;
            selectionMode
              ? toggleTopicSelect()
              : onToggleTopic(nb.slug, group.slug);
          }
        }}
        onDragOver={
          canMove
            ? (e) => {
                const drag = getActiveDrag();
                if (drag?.kind === "topic" && drag.id === group.id) return;
                if (drag?.kind === "page" || drag?.kind === "topic") {
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
        onDragLeave={(e) => {
          if (!relatedStillInside(e.currentTarget, e.relatedTarget)) {
            clearDropHint();
          }
        }}
        onDrop={
          canMove
            ? (e) => {
                const drag = getActiveDrag();
                if (drag?.kind === "topic" && drag.id === group.id) return;
                void finishReorderDrop(
                  {
                    kind: "topic-row",
                    subjectId: nb.id,
                    topicGroupId: group.id,
                  },
                  e,
                  {}
                );
                suppressClickRef.current = true;
              }
            : undefined
        }
        className={clsx(
          "group flex items-center gap-0.5 px-1 py-1 rounded-md hover:bg-[var(--bg-elevated)] select-none",
          canMove ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          showTopicRowDrop &&
            "ring-1 ring-[var(--accent)]/50 bg-[var(--accent-subtle)]",
          dragging && "opacity-40",
          topicDeleting && "opacity-50 pointer-events-none"
        )}
      >
        {selectionMode ? (
          <ExplorerSelectionToggle
            checked={selected.has(topicKey)}
            onToggle={toggleTopicSelect}
          />
        ) : (
          <span
            className="flex items-center justify-center shrink-0 w-[18px] h-[18px] p-0.5 text-[var(--text-muted)] pointer-events-none"
            aria-hidden
          >
            {tOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
        )}
        <FolderMark seed={group.id} size={14} />
        <span className="flex-1 min-w-0 truncate text-[13px] font-medium pointer-events-none">
          {group.title}
        </span>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0 pointer-events-none">
          {group.pages.length + children.length}
        </span>
        {!selectionMode && (
          <span
            className="flex items-center shrink-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              draggable={false}
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
            {canNest && (
              <button
                type="button"
                draggable={false}
                title="New folder"
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                onClick={() => onAddNestedFolder(nb, group)}
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              draggable={false}
              title="Add file"
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              onClick={() => onAddPage(nb, group)}
            >
              <FilePlus className="w-3.5 h-3.5" />
            </button>
            {topicDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)] m-0.5" />
            ) : (
              <button
                type="button"
                draggable={false}
                className="p-0.5 rounded text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)]"
                title="Delete folder"
                onClick={() => onDeleteTopic(nb, group.id, group.title)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </span>
        )}
      </div>
      {tOpen && (
        <div className="ml-6 pl-3 border-l border-[var(--border)] space-y-0.5 mt-0.5">
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
                pageIds={topicPageIds}
                activeDrag={activeDrag}
                getActiveDrag={getActiveDrag}
                startReorderDrag={startReorderDrag}
                allowReorderDrop={allowReorderDrop}
                finishReorderDrop={finishReorderDrop}
                clearDropHint={clearDropHint}
                clearActiveDrag={clearActiveDrag}
                scheduledHrefs={scheduledHrefs}
                onOpenPage={onOpenPage}
                onSharePage={onSharePage}
                onRenamePage={onRenamePage}
                onDeletePage={onDeletePage}
              />
            );
          })}
          {children.map((child) => {
            const tKey = `${nb.slug}:${child.slug}`;
            const childOpen = expandedTopics[tKey] ?? false;
            return (
              <ExplorerTopicBlock
                key={child.id}
                nb={nb}
                group={child}
                parentId={group.id}
                depth={depth + 1}
                tOpen={childOpen}
                selectionMode={selectionMode}
                selected={selected}
                onSelectionChange={onSelectionChange}
                libraryMoveEnabled={libraryMoveEnabled}
                activeDrag={activeDrag}
                getActiveDrag={getActiveDrag}
                dropHint={dropHint}
                startReorderDrag={startReorderDrag}
                allowReorderDrop={allowReorderDrop}
                finishReorderDrop={finishReorderDrop}
                clearDropHint={clearDropHint}
                clearActiveDrag={clearActiveDrag}
                onToggleTopic={onToggleTopic}
                onRenameTopic={onRenameTopic}
                onDeleteTopic={onDeleteTopic}
                onAddPage={onAddPage}
                onAddNestedFolder={onAddNestedFolder}
                enablePageDrag={enablePageDrag}
                scheduledHrefs={scheduledHrefs}
                onOpenPage={onOpenPage}
                onSharePage={onSharePage}
                onRenamePage={onRenamePage}
                onDeletePage={onDeletePage}
                notebookSlug={notebookSlug}
                currentTopicSlug={currentTopicSlug}
                currentPageSlug={currentPageSlug}
                currentHref={currentHref}
                expandedTopics={expandedTopics}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
