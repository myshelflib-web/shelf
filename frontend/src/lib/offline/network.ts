export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export const OFFLINE_STATUS_EVENT = "shelf:offline-status-changed";
export const OFFLINE_SYNC_EVENT = "shelf:offline-sync-changed";

export function dispatchOfflineStatus() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OFFLINE_STATUS_EVENT));
}

export function dispatchOfflineSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OFFLINE_SYNC_EVENT));
}
