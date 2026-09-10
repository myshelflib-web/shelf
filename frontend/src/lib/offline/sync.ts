import { flushOfflineHighlights } from "./highlights";
import { flushOfflineProgress } from "./progress";
import { flushOfflineTasks } from "./tasks";
import { dispatchOfflineSync, isOnline } from "./network";
import { dispatchSyncStatus } from "@/lib/syncStatus";

export async function flushOfflineSync(): Promise<number> {
  if (!isOnline()) return 0;
  dispatchSyncStatus({ state: "saving", label: "Syncing…" });
  try {
    const synced =
      (await flushOfflineTasks()) +
      (await flushOfflineHighlights()) +
      (await flushOfflineProgress());
    dispatchOfflineSync();
    if (synced > 0) {
      dispatchSyncStatus({ state: "synced", label: "Synced" });
    } else {
      dispatchSyncStatus({ state: "idle" });
    }
    return synced;
  } catch {
    dispatchSyncStatus({ state: "error", label: "Not synced" });
    dispatchOfflineSync();
    return 0;
  }
}
