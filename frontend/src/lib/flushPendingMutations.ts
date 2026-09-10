import { getStoredUserId } from "@/lib/accountLocalState";
import {
  clearEntitiesFailed,
  markEntitiesFailed,
} from "@/lib/entitySyncState";
import {
  removeSyncActivity,
  upsertQueuedMutationActivity,
  upsertSyncActivity,
} from "@/lib/syncActivityStore";
import { dispatchOfflineSync, isOnline } from "@/lib/offline/network";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import {
  MAX_SYNC_RETRY_ATTEMPTS,
  SYNC_RETRY_EXHAUSTED_AT,
  isSyncRetryExhausted,
  syncBackoffMs,
  syncRetryExhaustedMessage,
} from "@/lib/syncBackoff";
import {
  listDuePendingMutations,
  listPendingMutations,
  putPendingMutation,
  removePendingMutation,
  type PendingMutationEntry,
} from "@/lib/pendingMutationQueue";

type RawRequest = <T>(
  path: string,
  options?: RequestInit & { skipSyncStatus?: boolean }
) => Promise<T>;

let rawRequest: RawRequest | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

/** Wired from api.ts to avoid circular imports during module init. */
export function bindMutationFlushRequest(fn: RawRequest): void {
  rawRequest = fn;
}

function errorStatus(err: unknown): number | null {
  if (
    err &&
    typeof err === "object" &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
  ) {
    return (err as { status: number }).status;
  }
  return null;
}

function isTransientSyncError(err: unknown): boolean {
  const status = errorStatus(err);
  if (status == null) return true;
  if (status === 0) return true;
  if (status === 408 || status === 429) return true;
  if (status >= 500) return true;
  return false;
}

async function bumpBackoff(
  entry: PendingMutationEntry,
  err: unknown
): Promise<void> {
  const attempts = entry.attempts + 1;
  const message = err instanceof Error ? err.message : "Sync retry failed";
  markEntitiesFailed(entry.entityKeys);

  if (isSyncRetryExhausted(attempts)) {
    await putPendingMutation({
      ...entry,
      attempts,
      nextAttemptAt: SYNC_RETRY_EXHAUSTED_AT,
      lastError: syncRetryExhaustedMessage("sync"),
    });
    upsertQueuedMutationActivity({
      id: entry.id,
      title: "Sync change",
      detail: syncRetryExhaustedMessage("sync"),
    });
    // Force error styling on exhausted mutation rows.
    upsertSyncActivity({
      id: `queued-mut:${entry.id}`,
      kind: "mutation",
      title: "Sync change",
      status: "error",
      detail: syncRetryExhaustedMessage("sync"),
    });
    dispatchSyncStatus({ state: "error", label: "Not synced" });
    dispatchOfflineSync();
    return;
  }

  await putPendingMutation({
    ...entry,
    attempts,
    nextAttemptAt: Date.now() + syncBackoffMs(attempts),
    lastError: message,
  });
  upsertQueuedMutationActivity({
    id: entry.id,
    title: "Sync change",
    detail: `Retry ${attempts}/${MAX_SYNC_RETRY_ATTEMPTS}…`,
  });
  dispatchSyncStatus({ state: "error", label: "Not synced" });
  dispatchOfflineSync();
  scheduleFlushOfflineSync(syncBackoffMs(attempts));
}

export async function flushPendingMutations(): Promise<number> {
  const userId = getStoredUserId();
  if (!userId || !isOnline() || flushing || !rawRequest) return 0;
  flushing = true;
  let synced = 0;
  try {
    const due = await listDuePendingMutations(userId);
    if (due.length === 0) return 0;

    dispatchSyncStatus({ state: "saving", label: "Syncing…" });
    for (const entry of due) {
      try {
        await rawRequest(entry.path, {
          method: entry.method,
          body: entry.body,
          skipSyncStatus: true,
        });
        await removePendingMutation(entry.id);
        clearEntitiesFailed(entry.entityKeys);
        removeSyncActivity(`queued-mut:${entry.id}`);
        synced += 1;
      } catch (err) {
        if (!isTransientSyncError(err)) {
          await removePendingMutation(entry.id);
          continue;
        }
        if (errorStatus(err) === 0) break;
        await bumpBackoff(entry, err);
      }
    }
    return synced;
  } finally {
    flushing = false;
  }
}

export function scheduleFlushOfflineSync(delayMs = 0): void {
  if (typeof window === "undefined") return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void import("@/lib/offline/sync").then(({ flushOfflineSync }) => {
      void flushOfflineSync();
    });
  }, Math.max(0, delayMs));
}

export async function pendingMutationCount(userId: string): Promise<number> {
  return (await listPendingMutations(userId)).length;
}
