/** Shared trigger styling for ShelfSelect and text fields in modals/forms. */
export const shelfFieldClass =
  "mt-1 w-full px-3 py-2 text-sm rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50";

/** Compact ShelfSelect in sidebars/toolbars (no top margin). */
export const shelfSelectSidebarClass =
  "h-[34px] text-[11px] font-semibold rounded-lg bg-[var(--bg-elevated)] border-[var(--border)]";

/** Doc / blank editor toolbar selects — match ToolBtn compact height (h-7). */
export const shelfSelectToolbarClass =
  "box-border !h-7 !min-h-7 !max-h-7 shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] px-1 py-0 text-[10px] leading-none text-[var(--text-secondary)]";
