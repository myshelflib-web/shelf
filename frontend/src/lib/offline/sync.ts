import { flushOfflineHighlights } from "./highlights";
import { flushOfflineProgress } from "./progress";
import { flushOfflineTasks } from "./tasks";
import { flushPendingUploads } from "@/lib/flushPendingUploads";
import {
  flushPendingMutations,
  scheduleFlushOfflineSync,
} from "@/lib/flushPendingMutations";
import {
  MAX_SYNC_RETRY_ATTEMPTS,
  SYNC_RETRY_EXHAUSTED_AT,
  isSyncRetryExhausted,
  syncBackoffMs,
} from "@/lib/syncBackoff";
import { listPendingUploadSummaries } from "@/lib/pendingUploadQueue";
import { listPendingMutations } from "@/lib/pendingMutationQueue";
import { getStoredUserId } from "@/lib/accountLocalState";
import { clearAllFailedEntities } from "@/lib/entitySyncState";
import { dispatchOfflineSync, isOnline } from "./network";
import { dispatchSyncStatus } from "@/lib/syncStatus";

let flushAttempts = 0;

function soonestRetryAt(
  entries: { nextAttemptAt: number; attempts: number; lastError?: string }[]
): number | null {
  const active = entries.filter(
    (e) =>
      !isSyncRetryExhausted(e.attempts) &&
      e.nextAttemptAt < SYNC_RETRY_EXHAUSTED_AT &&
      !(e.lastError && /CORS|Cannot reach storage/i.test(e.lastError))
  );
  if (active.length === 0) return null;
  return Math.min(...active.map((e) => e.nextAttemptAt));
}

export async function flushOfflineSync(): Promise<number> {
  if (!isOnline()) return 0;
  try {
    const synced =
      (await flushOfflineTasks()) +
      (await flushOfflineHighlights()) +
      (await flushOfflineProgress()) +
      (await flushPendingMutations()) +
      (await flushPendingUploads());
    dispatchOfflineSync();
    const userId = getStoredUserId();
    const [uploadsLeft, mutationsLeft] = userId
      ? await Promise.all([
          listPendingUploadSummaries(userId),
          listPendingMutations(userId),
        ])
      : [[], []];
    const uploadRetryAt = soonestRetryAt(uploadsLeft);
    const mutationRetryAt = soonestRetryAt(mutationsLeft);
    const hasExhaustedOnly =
      (uploadsLeft.length > 0 || mutationsLeft.length > 0) &&
      uploadRetryAt == null &&
      mutationRetryAt == null;

    if (uploadRetryAt != null) {
      dispatchSyncStatus({ state: "error", label: "Not synced" });
      // Respect entry backoff — never schedule an immediate re-flush (delay 0)
      // after a failed upload, which caused a tight retry loop on CORS errors.
      scheduleFlushOfflineSync(Math.max(250, uploadRetryAt - Date.now()));
      flushAttempts = 0;
    } else if (mutationRetryAt != null) {
      dispatchSyncStatus({ state: "error", label: "Not synced" });
      scheduleFlushOfflineSync(Math.max(250, mutationRetryAt - Date.now()));
      flushAttempts = 0;
    } else if (hasExhaustedOnly) {
      flushAttempts = 0;
      dispatchSyncStatus({ state: "error", label: "Not synced" });
    } else if (synced > 0) {
      flushAttempts = 0;
      clearAllFailedEntities();
      dispatchSyncStatus({ state: "synced", label: "Synced" });
    } else {
      flushAttempts = 0;
      dispatchSyncStatus({ state: "idle" });
    }
    return synced;
  } catch {
    flushAttempts += 1;
    dispatchSyncStatus({ state: "error", label: "Not synced" });
    dispatchOfflineSync();
    if (flushAttempts < MAX_SYNC_RETRY_ATTEMPTS) {
      scheduleFlushOfflineSync(syncBackoffMs(flushAttempts));
    }
    return 0;
  }
}
