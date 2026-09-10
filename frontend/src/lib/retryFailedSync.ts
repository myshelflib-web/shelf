import { getStoredUserId } from "@/lib/accountLocalState";
import { scheduleFlushOfflineSync } from "@/lib/flushPendingMutations";
import { scheduleFlushPendingUploads } from "@/lib/flushPendingUploads";
import {
  getPendingUpload,
  listPendingUploadSummaries,
  putPendingUpload,
} from "@/lib/pendingUploadQueue";
import { listSessionDeferredUploads } from "@/lib/sessionDeferredUploads";
import {
  countFailedBulkUploads,
  retryFailedBulkUploads,
} from "@/lib/failedBulkUploads";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import { upsertQueuedUploadActivity } from "@/lib/syncActivityStore";
import { isOnline } from "@/lib/offline/network";

/**
 * User-initiated retry: wake parked upload queues + re-run failed bulk Files.
 * CORS rows are included — the user explicitly asked to try again.
 */
export async function retryFailedSync(): Promise<{
  bulkSucceeded: number;
  bulkFailed: number;
  wokeUploads: number;
}> {
  if (!isOnline()) {
    dispatchSyncStatus({ state: "error", label: "Offline" });
    return { bulkSucceeded: 0, bulkFailed: 0, wokeUploads: 0 };
  }

  dispatchSyncStatus({ state: "uploading", label: "Retrying…", percent: 0 });

  const userId = getStoredUserId();
  let wokeUploads = 0;

  if (userId) {
    const summaries = await listPendingUploadSummaries(userId);
    for (const s of summaries) {
      const full = await getPendingUpload(s.pageId);
      if (!full) continue;
      await putPendingUpload({
        ...full,
        attempts: 0,
        nextAttemptAt: 0,
        lastError: undefined,
      });
      upsertQueuedUploadActivity({
        pageId: full.pageId,
        title: full.title || full.filename,
        detail: "Retrying…",
        error: false,
      });
      wokeUploads += 1;
    }
    wokeUploads += listSessionDeferredUploads(userId).length;
  }

  scheduleFlushPendingUploads(0);
  scheduleFlushOfflineSync(0);

  const bulk = await retryFailedBulkUploads();

  if (bulk.failed > 0) {
    dispatchSyncStatus({ state: "error", label: "Not synced" });
  } else if (bulk.succeeded > 0 && wokeUploads === 0) {
    dispatchSyncStatus({ state: "synced", label: "Synced" });
  }

  return {
    bulkSucceeded: bulk.succeeded,
    bulkFailed: bulk.failed,
    wokeUploads,
  };
}

export function countRetryableFailures(): number {
  return countFailedBulkUploads();
}
