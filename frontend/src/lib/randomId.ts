/**
 * UUID-ish id for client queues / optimistic rows.
 * Prefer crypto.randomUUID when present; fall back for older Android WebViews.
 */
export function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
