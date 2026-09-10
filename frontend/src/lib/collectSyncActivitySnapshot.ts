import { getStoredUserId } from "@/lib/accountLocalState";
import { listPendingUploadSummaries } from "@/lib/pendingUploadQueue";
import { listPendingMutations } from "@/lib/pendingMutationQueue";
import { listSessionDeferredUploads } from "@/lib/sessionDeferredUploads";
import { MAX_SYNC_RETRY_ATTEMPTS, SYNC_RETRY_EXHAUSTED_AT } from "@/lib/syncBackoff";
import {
  emitSyncActivity,
  listSyncActivities,
  upsertQueuedMutationActivity,
  upsertQueuedUploadActivity,
  type SyncActivityItem,
} from "@/lib/syncActivityStore";

function mutationTitle(path: string, method: string): string {
  if (/\/title(?:\?|$)/.test(path)) return "Rename";
  if (/\/content(?:\?|$)/.test(path)) return "Save notes";
  if (/\/progress(?:\?|$)/.test(path)) return "Reading progress";
  if (/\/star(?:\?|$)/.test(path)) return "Star";
  if (/\/move(?:\?|$)/.test(path)) return "Move";
  if (method === "DELETE") return "Delete";
  if (path.includes("/topic-groups/")) return "Update folder";
  if (path.includes("/subjects/")) return "Update collection";
  if (path.startsWith("/api/tasks")) return "Planner item";
  if (path.startsWith("/api/highlights")) return "Highlight";
  return "Sync change";
}

/**
 * Merge live activities with durable upload/mutation queues.
 * Upserts are silent so we never re-enter via SYNC_ACTIVITY_EVENT (that loop
 * froze the UI whenever pending retries existed).
 */
export async function collectSyncActivitySnapshot(): Promise<SyncActivityItem[]> {
  const userId = getStoredUserId();
  let changed = false;
  if (userId) {
    const [uploads, mutations] = await Promise.all([
      listPendingUploadSummaries(userId),
      listPendingMutations(userId),
    ]);
    const session = listSessionDeferredUploads(userId);
    for (const u of uploads) {
      const parked =
        Boolean(u.lastError) ||
        u.nextAttemptAt >= SYNC_RETRY_EXHAUSTED_AT ||
        u.attempts >= MAX_SYNC_RETRY_ATTEMPTS;
      if (
        upsertQueuedUploadActivity({
          pageId: u.pageId,
          title: u.title || u.filename,
          detail: u.lastError ? u.lastError : "Waiting to upload…",
          error: parked,
          silent: true,
        })
      ) {
        changed = true;
      }
    }
    for (const u of session) {
      if (
        upsertQueuedUploadActivity({
          pageId: u.pageId,
          title: u.title || u.filename,
          detail: u.lastError,
          error: true,
          silent: true,
        })
      ) {
        changed = true;
      }
    }
    for (const m of mutations) {
      if (
        upsertQueuedMutationActivity({
          id: m.id,
          title: mutationTitle(m.path, m.method),
          detail: m.lastError ?? "Waiting to sync…",
          silent: true,
        })
      ) {
        changed = true;
      }
    }
  }
  if (changed) emitSyncActivity();
  return listSyncActivities().filter((a) => a.status !== "done");
}
