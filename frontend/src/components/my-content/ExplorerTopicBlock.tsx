"use client";

import { UserSubject, UserTopicGroup, UserPageSummary } from "@/types";
import { pageHref } from "@/lib/myContentTree";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  FilePlus,
  Pencil,
  Loader2,
} from "lucide-react";
import { ExplorerDragGrip } from "@/components/my-content/ExplorerDragGrip";
import { FolderMark } from "@/components/FolderMark";
import { ExplorerPageRow } from "@/components/my-content/ExplorerPageRow";
import { ExplorerSelectionToggle } from "@/components/my-content/ExplorerSelectionToggle";
import { ExplorerDropLine } from "@/components/my-content/ExplorerDropLine";
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

export function ExplorerTopicBlock({
  nb,
  group,
  tOpen,
  selectionMode,
  selected,
  onSelectionChange,
  libraryMoveEnabled,
  activeDrag,
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
}: {
  nb: UserSubject;
  group: UserTopicGroup;
  tOpen: boolean;
  selectionMode: boolean;
  selected: Set<ExplorerSelectionKey>;
  onSelectionChange: (next: Set<ExplorerSelectionKey>) => void;
  libraryMoveEnabled: boolean;
  activeDrag: ReorderDragPayload | null;
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
}) {
  const { prompt } = useAppDialog();
  const topicKey = topicSelectionKey(nb.id, group.id);
  const topicDeleting = Boolean(
    useDeleteProgressOptional()?.deletingKeys.has(topicKey)
  );
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
    <div>
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
                if (
                  activeDrag?.kind === "page" ||
                  activeDrag?.kind === "topic"
                ) {
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
            : undefined
        }
        className={clsx(
          "group flex items-center gap-0.5 px-1 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-elevated)]",
          showTopicRowDrop &&
            "ring-1 ring-[var(--accent)]/50 bg-[var(--accent-subtle)]",
          topicDeleting && "opacity-50 pointer-events-none"
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
            onDragEnd={clearActiveDrag}
          />
        )}
        <span className="p-0.5 text-[var(--text-muted)] shrink-0">
          {tOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <FolderMark seed={group.id} size={14} />
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
            {topicDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)] m-0.5" />
            ) : (
              <button
                type="button"
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
                clearActiveDrag={clearActiveDrag}
                scheduledHrefs={scheduledHrefs}
                onOpenPage={onOpenPage}
                onSharePage={onSharePage}
                onRenamePage={onRenamePage}
                onDeletePage={onDeletePage}
              />
            );
          })}
          {libraryMoveEnabled &&
            !selectionMode &&
            group.pages.length > 0 && (
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
}
