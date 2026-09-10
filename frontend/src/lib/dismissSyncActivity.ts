import { getStoredUserId } from "@/lib/accountLocalState";
import { clearEntitiesFailed } from "@/lib/entitySyncState";
import { dispatchOfflineSync } from "@/lib/offline/network";
import {
  removePendingMutation,
  listPendingMutations,
} from "@/lib/pendingMutationQueue";
import { removePendingUpload } from "@/lib/pendingUploadQueue";
import { removeSyncActivity } from "@/lib/syncActivityStore";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import { countAllPending } from "@/lib/offline/outbox";

/** Drop a parked failed sync row so it stops counting toward "Syncing". */
export async function dismissSyncActivity(id: string): Promise<void> {
  if (id.startsWith("queued-upload:")) {
    const pageId = id.slice("queued-upload:".length);
    await removePendingUpload(pageId);
    clearEntitiesFailed([`page:${pageId}`]);
  } else if (id.startsWith("queued-mut:")) {
    const mutId = id.slice("queued-mut:".length);
    const userId = getStoredUserId();
    if (userId) {
      const rows = await listPendingMutations(userId);
      const row = rows.find((r) => r.id === mutId);
      if (row?.entityKeys?.length) clearEntitiesFailed(row.entityKeys);
    }
    await removePendingMutation(mutId);
  }
  removeSyncActivity(id);
  dispatchOfflineSync();
  const left = await countAllPending();
  dispatchSyncStatus(
    left > 0
      ? { state: "error", label: "Not synced" }
      : { state: "synced", label: "Synced" }
  );
}
