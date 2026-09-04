"use client";

import clsx from "clsx";
import { useRef, useState, type DragEvent } from "react";
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
import { useAppDialog } from "@/hooks/useAppDialog";
import type { ExplorerDropHint } from "@/components/my-content/useExplorerReorderDrop";
import type { ReorderDragPayload } from "@/lib/libraryReorder";
import { useDeleteProgressOptional } from "@/components/DeleteProgressProvider";
import {
  beforeIdForPlace,
  dropPlaceFromY,
  relatedStillInside,
  type DropPlace,
} from "@/components/my-content/explorerRowDrag";

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
  pageIds?: string[];
  activeDrag?: ReorderDragPayload | null;
  getActiveDrag?: () => ReorderDragPayload | null;
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
  pageIds = [],
  activeDrag = null,
  getActiveDrag,
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
  const suppressClickRef = useRef(false);
  const [dropPlace, setDropPlace] = useState<DropPlace | null>(null);

  const canMove = Boolean(
    libraryMoveEnabled && !selectionMode && startReorderDrag
  );
  const canTabDrag = Boolean(
    enablePageDrag && scope && !selectionMode && !canMove
  );
  const dragging = activeDrag?.kind === "page" && activeDrag.id === page.id;

  const pageHint = (beforePageId: string | null): ExplorerDropHint => {
    if (topicGroupId && subjectId) {
      return {
        kind: "page-topic",
        subjectId,
        topicGroupId,
        beforePageId,
      };
    }
    if (subjectId) {
      return {
        kind: "page-notebook",
        subjectId,
        beforePageId,
      };
    }
    return { kind: "page-root", beforePageId };
  };

  const attachTabMime = (e: DragEvent) => {
    if (!enablePageDrag || !scope) return;
    const payload: ShelfPageDragPayload = {
      href,
      title: page.title,
      pageId: page.id,
      scope: scope as PersonalPageReaderScope,
    };
    e.dataTransfer.setData(SHELF_PAGE_MIME, JSON.stringify(payload));
  };

  const toggle = () => onSelectionChange(toggleSelectionKey(selected, key));

  return (
    <div
      draggable={canMove || canTabDrag}
      role="button"
      tabIndex={0}
      aria-busy={deleting || undefined}
      title={canMove ? `${page.title} — drag to move` : page.title}
      onDragStart={(e) => {
        if (deleting) {
          e.preventDefault();
          return;
        }
        suppressClickRef.current = false;
        if (canMove) {
          startReorderDrag?.(
            {
              kind: "page",
              id: page.id,
              subjectId,
              topicGroupId,
            },
            e
          );
          attachTabMime(e);
          return;
        }
        if (canTabDrag && scope) {
          attachTabMime(e);
          e.dataTransfer.setData("text/plain", href);
          e.dataTransfer.effectAllowed = "copy";
        }
      }}
      onDragEnd={() => {
        if (canMove) suppressClickRef.current = true;
        setDropPlace(null);
        clearActiveDrag?.();
      }}
      onDragOver={(e) => {
        const drag = getActiveDrag?.();
        if (!canMove || drag?.kind !== "page" || drag.id === page.id) return;
        const place = dropPlaceFromY(e);
        const hint = pageHint(beforeIdForPlace(pageIds, page.id, place));
        allowReorderDrop?.(hint, e);
        setDropPlace((prev) => (prev === place ? prev : place));
      }}
      onDragLeave={(e) => {
        if (relatedStillInside(e.currentTarget, e.relatedTarget)) return;
        setDropPlace(null);
        clearDropHint?.();
      }}
      onDrop={(e) => {
        const drag = getActiveDrag?.();
        setDropPlace(null);
        if (!canMove || drag?.kind !== "page" || drag.id === page.id) return;
        const place = dropPlaceFromY(e);
        const hint = pageHint(beforeIdForPlace(pageIds, page.id, place));
        void finishReorderDrop?.(hint, e, { pageIds });
        suppressClickRef.current = true;
      }}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
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
        "library-row group relative flex items-center gap-0.5 rounded-md text-[13px] min-w-0 px-1 py-1 select-none",
        canMove
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer",
        isActive
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
        dragging && "opacity-40",
        deleting && "opacity-50 pointer-events-none",
        dropPlace === "before" &&
          "before:absolute before:left-1 before:right-1 before:top-0 before:h-0.5 before:rounded-full before:bg-[var(--accent)]",
        dropPlace === "after" &&
          "after:absolute after:left-1 after:right-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--accent)]"
      )}
    >
      {selectionMode ? (
        <ExplorerSelectionToggle checked={selected.has(key)} onToggle={toggle} />
      ) : (
        <>
          <span className="relative flex items-center justify-center shrink-0 w-[18px] h-[18px]" />
          {page.completed ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] pointer-events-none" />
          ) : page.contentType === "VIDEO" ? (
            <Youtube className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] pointer-events-none" />
          ) : (
            <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)] pointer-events-none" />
          )}
        </>
      )}
      <span className="flex-1 min-w-0 truncate text-[13px] pointer-events-none">
        {page.title}
      </span>
      {!selectionMode && (
        <span
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            draggable={false}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--accent)] opacity-0 group-hover:opacity-100"
            title="Share file"
            aria-label="Share file"
            onClick={() => onSharePage(page.id, page.title)}
          >
            <Share2 className="w-3 h-3" />
          </button>
          <button
            type="button"
            draggable={false}
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
              draggable={false}
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
  );
}
