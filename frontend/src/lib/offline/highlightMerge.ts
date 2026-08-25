import type { UserContentHighlight } from "@/types";
import type { LocalHighlight } from "./db";

export function stripHighlightMeta(row: LocalHighlight): UserContentHighlight {
  const { syncStatus: _s, localOnly: _l, updatedAt: _u, userId: _uid, pageId: _pid, ...rest } =
    row;
  return rest;
}

export function toLocalHighlight(
  highlight: UserContentHighlight,
  userId: string,
  pageId: string,
  partial?: Partial<LocalHighlight>,
): LocalHighlight {
  return {
    ...highlight,
    userId,
    pageId,
    syncStatus: "synced",
    localOnly: false,
    updatedAt: Date.now(),
    ...partial,
  };
}

export function mergeHighlightLists(
  server: UserContentHighlight[],
  local: LocalHighlight[],
  pageId: string,
): UserContentHighlight[] {
  const forPage = local.filter((h) => h.pageId === pageId);
  const deleted = new Set(
    forPage.filter((h) => h.syncStatus === "pending-delete").map((h) => h.id),
  );
  const byId = new Map<string, LocalHighlight>();
  for (const row of forPage) {
    if (row.syncStatus === "pending-delete") continue;
    byId.set(row.id, row);
  }

  const merged: UserContentHighlight[] = [];
  const seen = new Set<string>();

  for (const h of server) {
    if (deleted.has(h.id)) continue;
    seen.add(h.id);
    const localRow = byId.get(h.id);
    if (localRow && (localRow.localOnly || localRow.syncStatus === "pending")) {
      merged.push(stripHighlightMeta(localRow));
    } else {
      merged.push(h);
    }
  }

  for (const row of forPage) {
    if (row.syncStatus === "pending-delete") continue;
    if (row.localOnly && !seen.has(row.id)) {
      merged.push(stripHighlightMeta(row));
    }
  }

  return merged;
}
