import { flushOfflineHighlights } from "./highlights";
import { flushOfflineProgress } from "./progress";
import { flushOfflineTasks } from "./tasks";
import { dispatchOfflineSync, isOnline } from "./network";

export async function flushOfflineSync(): Promise<number> {
  if (!isOnline()) return 0;
  const synced =
    (await flushOfflineTasks()) +
    (await flushOfflineHighlights()) +
    (await flushOfflineProgress());
  dispatchOfflineSync();
  return synced;
}
