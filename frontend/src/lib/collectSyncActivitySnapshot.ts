import { getStoredUserId } from "@/lib/accountLocalState";
import { listPendingMutations } from "@/lib/pendingMutationQueue";
import { listPendingUploads } from "@/lib/pendingUploadQueue";
import {
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

/** Merge live activities with durable upload/mutation queues. */
export async function collectSyncActivitySnapshot(): Promise<SyncActivityItem[]> {
  const userId = getStoredUserId();
  if (userId) {
    const [uploads, mutations] = await Promise.all([
      listPendingUploads(userId),
      listPendingMutations(userId),
    ]);
    for (const u of uploads) {
      upsertQueuedUploadActivity({
        pageId: u.pageId,
        title: u.title || u.filename,
        detail: u.lastError ? u.lastError : "Waiting to upload…",
        error: Boolean(u.lastError),
      });
    }
    for (const m of mutations) {
      upsertQueuedMutationActivity({
        id: m.id,
        title: mutationTitle(m.path, m.method),
        detail: m.lastError ?? "Waiting to sync…",
      });
    }
  }
  return listSyncActivities().filter((a) => a.status !== "done");
}
