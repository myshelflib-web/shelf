import { api, isNetworkError } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
import {
  mergeProgressQueue,
  readProgressQueue,
  removeProgressQueue,
} from "./outbox";
import { isOnline, dispatchOfflineSync } from "./network";
import { progressQueueKey } from "./db";

export type ProgressPatch = {
  readPercent?: number;
  completed?: boolean;
  view?: {
    pdfPage?: number;
    pageOffset?: number;
    scrollTop?: number;
    scale?: number;
  };
};

export async function updatePageProgress(pageId: string, patch: ProgressPatch): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) return;

  if (isOnline()) {
    try {
      await api.myContent.updateProgress(pageId, patch);
      await removeProgressQueue(progressQueueKey(userId, pageId));
      return;
    } catch (err) {
      if (!isNetworkError(err)) throw err;
    }
  }

  await mergeProgressQueue(userId, pageId, patch);
  dispatchOfflineSync();
}

export async function flushOfflineProgress(): Promise<number> {
  const userId = getStoredUserId();
  if (!userId || !isOnline()) return 0;

  const entries = (await readProgressQueue(userId)).sort((a, b) => a.updatedAt - b.updatedAt);
  let synced = 0;

  for (const entry of entries) {
    try {
      await api.myContent.updateProgress(entry.pageId, entry.payload);
      await removeProgressQueue(entry.key);
      synced += 1;
    } catch (err) {
      if (isNetworkError(err)) break;
      throw err;
    }
  }

  return synced;
}
