/**
 * Tab-session fallback when IndexedDB cannot hold deferred upload bytes.
 * Survives eviction / quota for this tab only — reload loses these Files.
 */

import { getStoredUserId } from "@/lib/accountLocalState";
import type { UserContentType } from "@/types";
import { upsertQueuedUploadActivity } from "@/lib/syncActivityStore";
import { dispatchOfflineSync } from "@/lib/offline/network";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import { markEntitiesFailed } from "@/lib/entitySyncState";

export type SessionDeferredUpload = {
  pageId: string;
  userId: string;
  token: string;
  uploadUrl: string;
  contentTypeHeader: string;
  filename: string;
  title: string;
  contentType: UserContentType;
  pdfCacheVersion?: string;
  clientPacked: boolean;
  putDone: boolean;
  file: File;
  createdAt: number;
  lastError: string;
};

const byPageId = new Map<string, SessionDeferredUpload>();

export function putSessionDeferredUpload(
  entry: SessionDeferredUpload
): void {
  byPageId.set(entry.pageId, entry);
  markEntitiesFailed([`page:${entry.pageId}`]);
  upsertQueuedUploadActivity({
    pageId: entry.pageId,
    title: entry.title || entry.filename,
    detail: entry.lastError,
    error: true,
  });
  dispatchSyncStatus({ state: "error", label: "Not synced" });
  dispatchOfflineSync();
}

export function getSessionDeferredUpload(
  pageId: string
): SessionDeferredUpload | null {
  return byPageId.get(pageId) ?? null;
}

export function removeSessionDeferredUpload(pageId: string): void {
  byPageId.delete(pageId);
}

export function listSessionDeferredUploads(
  userId?: string | null
): SessionDeferredUpload[] {
  const uid = userId ?? getStoredUserId();
  const all = [...byPageId.values()];
  if (!uid) return all;
  return all.filter((e) => e.userId === uid);
}

export function countSessionDeferredUploads(userId?: string | null): number {
  return listSessionDeferredUploads(userId).length;
}
