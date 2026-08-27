"use client";

import clsx from "clsx";
import {
  CheckCircle2,
  Check,
  Star,
  Trash2,
  CalendarDays,
  FileText,
  Pencil,
  Share2,
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
import type { DragEvent } from "react";

interface ExplorerPageRowProps {
  page: UserPageSummary;
  href: string;
  isActive: boolean;
  selectionMode: boolean;
  selected: Set<ExplorerSelectionKey>;
  onSelectionChange: (next: Set<ExplorerSelectionKey>) => void;
  enablePageDrag: boolean;
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
  scheduledHrefs,
  onOpenPage,
  onSharePage,
  onRenamePage,
  onDeletePage,
}: ExplorerPageRowProps) {
  const key = pageSelectionKey(page.id);
  const isScheduled = scheduledHrefs.has(href);
  const scope = scopeFromHref(href);
  const dragProps =
    enablePageDrag && scope && !selectionMode
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

  return (
    <div
      {...dragProps}
      role="button"
      tabIndex={0}
      onClick={() => (selectionMode ? toggle() : onOpenPage(page, href))}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectionMode ? toggle() : onOpenPage(page, href);
        }
      }}
      className={clsx(
        "library-row group flex items-center gap-1 rounded-md text-[13px] min-w-0 px-1.5 py-1 cursor-pointer",
        isActive
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]",
        enablePageDrag && !selectionMode && "active:cursor-grabbing"
      )}
    >
      {selectionMode ? (
        <ExplorerSelectionToggle checked={selected.has(key)} onToggle={toggle} />
      ) : page.completed ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
      ) : (
        <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
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
            title="Share page"
            aria-label="Share page"
            onClick={() => onSharePage(page.id, page.title)}
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
              await onRenamePage(page.id, title.trim());
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
            onClick={() => onDeletePage(page.id, page.title)}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </span>
      )}
    </div>
  );
}
