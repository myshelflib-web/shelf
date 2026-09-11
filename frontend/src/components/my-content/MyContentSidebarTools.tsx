"use client";

import {
  FolderOpen,
  FilePlus,
  FolderPlus,
  RefreshCw,
  FoldVertical,
  Search,
  ArrowDownWideNarrow,
  CheckSquare,
  XSquare,
} from "lucide-react";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { shelfSelectSidebarClass } from "@/lib/ui/fieldClasses";
import { withShortcut } from "@/lib/hotkeys";
import clsx from "clsx";
import type { ReactNode } from "react";

type SortCriterion = "activity" | "name";

const SORT_CRITERIA: { id: SortCriterion; label: string }[] = [
  { id: "activity", label: "Last activity" },
  { id: "name", label: "Name" },
];

export function MyContentSidebarTools({
  libraryModeTabs,
  selectionMode,
  onToggleSelection,
  onAddPage,
  onAddNotebook,
  onRefresh,
  loading,
  onCollapseAll,
  workspaceMode,
  query,
  onQueryChange,
  sortCriterion,
  onSortCriterionChange,
  sortDirTitle,
  sortAscending,
  onToggleSortDirection,
  libraryMoveEnabled,
}: {
  libraryModeTabs?: ReactNode;
  selectionMode: boolean;
  onToggleSelection: () => void;
  onAddPage: () => void;
  onAddNotebook: () => void;
  onRefresh: () => void;
  loading: boolean;
  onCollapseAll: () => void;
  workspaceMode: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  sortCriterion: SortCriterion;
  onSortCriterionChange: (c: SortCriterion) => void;
  sortDirTitle: string;
  sortAscending: boolean;
  onToggleSortDirection: () => void;
  libraryMoveEnabled: boolean;
}) {
  return (
    <div className="p-2 border-b border-[var(--border)] space-y-2 explorer-sidebar-tools">
      {libraryModeTabs}
      <div className="flex items-center gap-1 min-w-0 px-1 explorer-sidebar-tools-title">
        <FolderOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
        <h2 className="font-semibold text-sm truncate flex-1 min-w-0">
          Explorer
        </h2>
        <div className="flex items-center shrink-0 explorer-sidebar-tools-actions">
          <button
            type="button"
            title={
              selectionMode ? "Exit selection mode" : "Select items to delete"
            }
            aria-label={selectionMode ? "Exit selection mode" : "Select items"}
            data-tour-id="lib-select-mode"
            onClick={onToggleSelection}
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
            data-tour-id="lib-add-file"
            onClick={onAddPage}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <FilePlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={withShortcut("Create a new folder", "c n")}
            aria-label="New folder"
            data-tour-id="lib-add-folder"
            onClick={onAddNotebook}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Refresh library list"
            aria-label="Refresh"
            onClick={onRefresh}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            type="button"
            title="Collapse all folders"
            aria-label="Collapse all"
            onClick={onCollapseAll}
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
            onChange={(e) => onQueryChange(e.target.value)}
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
            options={SORT_CRITERIA.map((s) => ({
              value: s.id,
              label: s.label,
            }))}
            onChange={(v) => onSortCriterionChange(v as SortCriterion)}
          />
          <button
            type="button"
            title={sortDirTitle}
            aria-label={sortDirTitle}
            onClick={onToggleSortDirection}
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
  );
}
