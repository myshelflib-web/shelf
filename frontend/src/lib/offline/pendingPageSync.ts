import { readOutbox, readProgressQueue } from "@/lib/offline/outbox";
import { collectPendingUploadPageIds } from "@/lib/pendingUploadQueue";
import {
  collectPendingMutationEntityKeys,
  collectPendingMutationPageIds,
} from "@/lib/pendingMutationQueue";
import { readFailedEntityKeys } from "@/lib/entitySyncState";
import type { UserSubject, UserTopicGroup } from "@/types";
import {
  getNotebookPages,
  getTopicChildren,
  getTopicGroups,
} from "@/lib/myContentTree";

export type ItemSyncVisual = "synced" | "pending" | "error";

/** Page ids with queued offline progress, highlights, uploads, or mutations. */
export async function collectPendingPageIds(
  userId: string
): Promise<Set<string>> {
  const ids = new Set<string>();
  const [progress, outbox, uploads, mutationPages] = await Promise.all([
    readProgressQueue(userId),
    readOutbox(userId),
    collectPendingUploadPageIds(userId),
    collectPendingMutationPageIds(userId),
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
  for (const id of uploads) ids.add(id);
  for (const id of mutationPages) ids.add(id);
  return ids;
}

export async function collectPendingEntityKeys(
  userId: string,
  knownPages?: Set<string>
): Promise<Set<string>> {
  const keys = await collectPendingMutationEntityKeys(userId);
  const pages = knownPages ?? (await collectPendingPageIds(userId));
  for (const pageId of pages) {
    keys.add(`page:${pageId}`);
  }
  return keys;
}

export function collectFailedEntityKeys(): Set<string> {
  return readFailedEntityKeys();
}

export function resolveItemSyncVisual(
  pageId: string,
  pending: Set<string>,
  failed: Set<string>,
  pendingEntities?: Set<string>,
  failedEntities?: Set<string>
): ItemSyncVisual {
  const pageKey = `page:${pageId}`;
  if (failed.has(pageId) || failedEntities?.has(pageKey)) return "error";
  if (pending.has(pageId) || pendingEntities?.has(pageKey)) return "pending";
  return "synced";
}

export function resolveFolderSyncVisual(
  pageIds: string[],
  pending: Set<string>,
  failed: Set<string>,
  folderKey?: string,
  pendingEntities?: Set<string>,
  failedEntities?: Set<string>
): ItemSyncVisual {
  if (folderKey) {
    if (failedEntities?.has(folderKey)) return "error";
    if (pendingEntities?.has(folderKey)) return "pending";
  }
  let anyPending = false;
  for (const id of pageIds) {
    const visual = resolveItemSyncVisual(
      id,
      pending,
      failed,
      pendingEntities,
      failedEntities
    );
    if (visual === "error") return "error";
    if (visual === "pending") anyPending = true;
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
