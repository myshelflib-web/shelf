"use client";

import clsx from "clsx";
import {
  CheckCircle2,
  Star,
  Trash2,
  CalendarDays,
  FileText,
  Pencil,
  Share2,
  Youtube,
  Loader2,
} from "lucide-react";
import { UserPageSummary } from "@/types";
import {
  PersonalPageReaderScope,
  SHELF_PAGE_MIME,
  ShelfPageDragPayload,
  scopeFromHref,
} from "@/components/my-content/reader/types";
import {
  pageSelectionKey,
  toggleSelectionKey,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import { ExplorerSelectionToggle } from "@/components/my-content/ExplorerSelectionToggle";
import { ExplorerDropLine } from "@/components/my-content/ExplorerDropLine";
import { ExplorerDragGrip } from "@/components/my-content/ExplorerDragGrip";
import type { DragEvent } from "react";
import { useAppDialog } from "@/hooks/useAppDialog";
import type { ExplorerDropHint } from "@/components/my-content/useExplorerReorderDrop";
import type { ReorderDragPayload } from "@/lib/libraryReorder";
import { useDeleteProgressOptional } from "@/components/DeleteProgressProvider";

interface ExplorerPageRowProps {
  page: UserPageSummary;
  href: string;
  isActive: boolean;
  selectionMode: boolean;
  selected: Set<ExplorerSelectionKey>;
  onSelectionChange: (next: Set<ExplorerSelectionKey>) => void;
  enablePageDrag: boolean;
  libraryMoveEnabled?: boolean;
  subjectId?: string | null;
  topicGroupId?: string | null;
  showPageDrop?: boolean;
  pageIds?: string[];
  dropHint?: ExplorerDropHint | null;
  startReorderDrag?: (payload: ReorderDragPayload, e: DragEvent) => void;
  allowReorderDrop?: (hint: ExplorerDropHint, e: DragEvent) => void;
  finishReorderDrop?: (
    hint: ExplorerDropHint,
    e: DragEvent,
    context: { pageIds?: string[] }
  ) => void | Promise<void>;
  clearDropHint?: () => void;
  clearActiveDrag?: () => void;
  scheduledHrefs: Set<string>;
  onOpenPage: (page: UserPageSummary, href: string) => void;
  onSharePage: (pageId: string, title: string) => void;
  onRenamePage: (pageId: string, title: string) => void | Promise<void>;
  onDeletePage: (pageId: string, title: string) => void | Promise<void>;
}

export function ExplorerPageRow({
  page,
  href,
  isActive,
  selectionMode,
  selected,
  onSelectionChange,
  enablePageDrag,
  libraryMoveEnabled = false,
  subjectId = null,
  topicGroupId = null,
  showPageDrop = false,
  pageIds = [],
  dropHint,
  startReorderDrag,
  allowReorderDrop,
  finishReorderDrop,
  clearDropHint,
  clearActiveDrag,
  scheduledHrefs,
  onOpenPage,
  onSharePage,
  onRenamePage,
  onDeletePage,
}: ExplorerPageRowProps) {
  const { prompt } = useAppDialog();
  const key = pageSelectionKey(page.id);
  const deleting = Boolean(useDeleteProgressOptional()?.deletingKeys.has(key));
  const isScheduled = scheduledHrefs.has(href);
  const scope = scopeFromHref(href);

  const pageDropHint = (): ExplorerDropHint | null => {
    if (topicGroupId && subjectId) {
      return {
        kind: "page-topic",
        subjectId,
        topicGroupId,
        beforePageId: page.id,
      };
    }
    if (subjectId) {
      return {
        kind: "page-notebook",
        subjectId,
        beforePageId: page.id,
      };
    }
    return { kind: "page-root", beforePageId: page.id };
  };

  const dropActive = (() => {
    const hint = pageDropHint();
    if (!hint || !dropHint) return false;
    if (hint.kind === "page-root" && dropHint.kind === "page-root") {
      return dropHint.beforePageId === hint.beforePageId;
    }
    if (hint.kind === "page-notebook" && dropHint.kind === "page-notebook") {
      return (
        dropHint.subjectId === hint.subjectId &&
        dropHint.beforePageId === hint.beforePageId
      );
    }
    if (hint.kind === "page-topic" && dropHint.kind === "page-topic") {
      return (
        dropHint.subjectId === hint.subjectId &&
        dropHint.topicGroupId === hint.topicGroupId &&
        dropHint.beforePageId === hint.beforePageId
      );
    }
    return false;
  })();

  const tabDragProps =
    enablePageDrag && scope && !selectionMode && !libraryMoveEnabled
      ? {
          draggable: true as const,
          onDragStart: (e: DragEvent) => {
            const payload: ShelfPageDragPayload = {
              href,
              title: page.title,
              pageId: page.id,
              scope: scope as PersonalPageReaderScope,
            };
            e.dataTransfer.setData(SHELF_PAGE_MIME, JSON.stringify(payload));
            e.dataTransfer.setData("text/plain", href);
            e.dataTransfer.effectAllowed = "copy";
          },
        }
      : {};

  const toggle = () =>
    onSelectionChange(toggleSelectionKey(selected, key));

  const hint = pageDropHint();

  return (
    <div>
      {libraryMoveEnabled && !selectionMode && hint && allowReorderDrop && (
        <>
          <ExplorerDropLine active={showPageDrop && dropActive} />
          <div
            className="h-0"
            onDragOver={(e) => allowReorderDrop(hint, e)}
            onDragLeave={clearDropHint}
            onDrop={(e) =>
              void finishReorderDrop?.(hint, e, { pageIds })
            }
          />
        </>
      )}
      <div
        {...tabDragProps}
        role="button"
        tabIndex={0}
        aria-busy={deleting || undefined}
        onClick={() => {
          if (deleting) return;
          selectionMode ? toggle() : onOpenPage(page, href);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (deleting) return;
            selectionMode ? toggle() : onOpenPage(page, href);
          }
        }}
        className={clsx(
          "library-row group flex items-center gap-0.5 rounded-md text-[13px] min-w-0 px-1 py-1 cursor-pointer",
          isActive
            ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
          enablePageDrag && !selectionMode && !libraryMoveEnabled && "active:cursor-grabbing",
          deleting && "opacity-50 pointer-events-none"
        )}
      >
        {selectionMode ? (
          <ExplorerSelectionToggle checked={selected.has(key)} onToggle={toggle} />
        ) : (
          <>
            <ExplorerDragGrip
              active={Boolean(libraryMoveEnabled && startReorderDrag)}
              label="Drag to move file"
              iconClassName="w-3 h-3"
              onDragStart={(e) =>
                startReorderDrag?.(
                  {
                    kind: "page",
                    id: page.id,
                    subjectId,
                    topicGroupId,
                  },
                  e
                )
              }
              onDragEnd={clearActiveDrag}
            />
            {page.completed ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            ) : page.contentType === "VIDEO" ? (
              <Youtube className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            ) : (
              <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            )}
          </>
        )}
        <span className="flex-1 min-w-0 truncate text-[13px]" title={page.title}>
          {page.title}
        </span>
        {!selectionMode && (
          <span
            className="flex items-center gap-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100"
              title="Share file"
              aria-label="Share file"
              onClick={() => onSharePage(page.id, page.title)}
            >
              <Share2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100"
              title="Rename file"
              onClick={async () => {
                const title = await prompt({
                  title: "Rename file",
                  defaultValue: page.title,
                  confirmLabel: "Rename",
                });
                if (!title || title === page.title) return;
                await onRenamePage(page.id, title);
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
            {deleting ? (
              <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
            ) : (
              <button
                type="button"
                className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100"
                title="Delete file"
                onClick={() => onDeletePage(page.id, page.title)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
