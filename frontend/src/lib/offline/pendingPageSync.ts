import { readOutbox, readProgressQueue } from "@/lib/offline/outbox";
import type { UserSubject, UserTopicGroup } from "@/types";
import {
  getNotebookPages,
  getTopicChildren,
  getTopicGroups,
} from "@/lib/myContentTree";

export type ItemSyncVisual = "synced" | "pending" | "error";

/** Page ids with queued offline progress or highlight mutations. */
export async function collectPendingPageIds(
  userId: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  const [progress, outbox] = await Promise.all([
    readProgressQueue(userId),
    readOutbox(userId),
  ]);
  for (const entry of progress) {
    if (entry.pageId) ids.add(entry.pageId);
  }
  for (const entry of outbox) {
    if (entry.kind !== "highlight") continue;
    const pageId = String(
      entry.payload.pageId ?? entry.payload.userTopicId ?? ""
    ).trim();
    if (pageId) ids.add(pageId);
  }
  return ids;
}

export function resolveItemSyncVisual(
  pageId: string,
  pending: Set<string>,
  failed: Set<string>
): ItemSyncVisual {
  if (failed.has(pageId)) return "error";
  if (pending.has(pageId)) return "pending";
  return "synced";
}

export function resolveFolderSyncVisual(
  pageIds: string[],
  pending: Set<string>,
  failed: Set<string>
): ItemSyncVisual {
  let anyPending = false;
  for (const id of pageIds) {
    if (failed.has(id)) return "error";
    if (pending.has(id)) anyPending = true;
  }
  return anyPending ? "pending" : "synced";
}

export function pageIdsInTopicGroup(group: UserTopicGroup): string[] {
  const ids = (group.pages ?? []).map((p) => p.id);
  for (const child of getTopicChildren(group)) {
    ids.push(...pageIdsInTopicGroup(child));
  }
  return ids;
}

export function pageIdsInSubject(subject: UserSubject): string[] {
  const ids: string[] = [];
  for (const p of getNotebookPages(subject)) ids.push(p.id);
  for (const g of getTopicGroups(subject)) {
    ids.push(...pageIdsInTopicGroup(g));
  }
  return ids;
}
