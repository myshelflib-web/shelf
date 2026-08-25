import { isOnline } from "./network";

export const OFFLINE_NOTICE_EVENT = "shelf:offline-notice";

export function offlineFeatureMessage(feature?: string): string {
  if (feature) {
    return `${feature} needs an internet connection. You're offline right now.`;
  }
  return "You're offline. Connect to the internet to use this feature.";
}

export function notifyOffline(feature?: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(OFFLINE_NOTICE_EVENT, { detail: { feature: feature ?? null } }),
  );
}

/** Returns true when the action may proceed (online). */
export function requireOnline(feature?: string): boolean {
  if (isOnline()) return true;
  notifyOffline(feature);
  return false;
}
