import { isOnline } from "./network";

export const OFFLINE_NOTICE_EVENT = "shelf:offline-notice";
export const ACTION_ERROR_EVENT = "shelf:action-error";

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

/** Toast a short failure after an optimistic UI rollback (star, mark done, …). */
export function notifyActionError(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(ACTION_ERROR_EVENT, { detail: { message } }),
  );
}

/** Returns true when the action may proceed (online). */
export function requireOnline(feature?: string): boolean {
  if (isOnline()) return true;
  notifyOffline(feature);
  return false;
}
