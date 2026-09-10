/** Global sync/upload status for the header badge. */

export const SYNC_STATUS_EVENT = "shelf:sync-status";

export type SyncStatusDetail =
  | { state: "idle" }
  | { state: "uploading"; label?: string; percent?: number }
  | { state: "saving"; label?: string }
  | { state: "synced"; label?: string }
  | { state: "error"; label?: string };

export function dispatchSyncStatus(detail: SyncStatusDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SyncStatusDetail>(SYNC_STATUS_EVENT, { detail })
  );
}

export function syncStatusFromEvent(e: Event): SyncStatusDetail | null {
  if (!("detail" in e)) return null;
  const detail = (e as CustomEvent<SyncStatusDetail>).detail;
  if (!detail || typeof detail !== "object" || !("state" in detail)) return null;
  return detail;
}
