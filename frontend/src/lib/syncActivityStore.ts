/** In-memory list of background sync/upload jobs for the header dropdown. */

import type { UploadProgress } from "@/lib/uploadLibraryFile";
import { randomId } from "@/lib/randomId";

export const SYNC_ACTIVITY_EVENT = "shelf:sync-activity";

export type SyncActivityStatus =
  | "preparing"
  | "uploading"
  | "finalizing"
  | "pending"
  | "error"
  | "done";

export type SyncActivityKind = "upload" | "retry" | "mutation" | "sync";

export type SyncActivityItem = {
  id: string;
  kind: SyncActivityKind;
  title: string;
  status: SyncActivityStatus;
  percent?: number;
  detail?: string;
  updatedAt: number;
};

const items = new Map<string, SyncActivityItem>();
let activeUploadId: string | null = null;
const removeTimers = new Map<string, ReturnType<typeof setTimeout>>();

let lastProgressEmitAt = 0;
let lastProgressPercent = -1;

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SYNC_ACTIVITY_EVENT));
}

function sameActivity(
  a: SyncActivityItem | undefined,
  b: SyncActivityItem
): boolean {
  if (!a) return false;
  return (
    a.kind === b.kind &&
    a.title === b.title &&
    a.status === b.status &&
    a.percent === b.percent &&
    a.detail === b.detail
  );
}

export function listSyncActivities(): SyncActivityItem[] {
  return [...items.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getActiveUploadActivityId(): string | null {
  return activeUploadId;
}

export function clearActiveUploadActivity(): void {
  activeUploadId = null;
}

export function upsertSyncActivity(
  partial: Omit<SyncActivityItem, "updatedAt"> & { updatedAt?: number },
  opts?: { silent?: boolean }
): boolean {
  const prev = items.get(partial.id);
  const next: SyncActivityItem = {
    ...prev,
    ...partial,
    updatedAt: partial.updatedAt ?? Date.now(),
  };
  if (sameActivity(prev, next)) return false;
  items.set(partial.id, next);
  const existingTimer = removeTimers.get(partial.id);
  if (existingTimer && next.status !== "done") {
    clearTimeout(existingTimer);
    removeTimers.delete(partial.id);
  }
  if (!opts?.silent) emit();
  return true;
}

export function emitSyncActivity(): void {
  emit();
}

export function removeSyncActivity(id: string): void {
  if (!items.has(id)) return;
  items.delete(id);
  if (activeUploadId === id) activeUploadId = null;
  const timer = removeTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    removeTimers.delete(id);
  }
  emit();
}

function scheduleRemove(id: string, ms: number) {
  const prev = removeTimers.get(id);
  if (prev) clearTimeout(prev);
  removeTimers.set(
    id,
    setTimeout(() => {
      removeTimers.delete(id);
      removeSyncActivity(id);
    }, ms)
  );
}

/** Start tracking a live file upload; subsequent progress maps to this id. */
export function beginUploadActivity(title: string, id = randomId()): string {
  activeUploadId = id;
  lastProgressEmitAt = 0;
  lastProgressPercent = -1;
  upsertSyncActivity({
    id,
    kind: "upload",
    title: title.trim() || "Upload",
    status: "preparing",
    percent: 0,
  });
  return id;
}

export function applyUploadProgressToActivity(
  progress: UploadProgress,
  id = activeUploadId
): void {
  if (!id) return;
  const prev = items.get(id);
  if (!prev) return;
  if (progress.phase === "compressing") {
    upsertSyncActivity({
      ...prev,
      status: "preparing",
      percent: progress.percent,
      detail: "Preparing…",
    });
    return;
  }
  if (progress.phase === "finalizing") {
    upsertSyncActivity({
      ...prev,
      status: "finalizing",
      percent: 100,
      detail: "Saving…",
    });
    return;
  }
  const now = Date.now();
  const jumped =
    progress.percent === 100 ||
    progress.percent - lastProgressPercent >= 5 ||
    now - lastProgressEmitAt >= 400;
  if (!jumped) {
    // Keep in-memory percent without waking every listener.
    items.set(id, {
      ...prev,
      status: "uploading",
      percent: progress.percent,
      detail: `Uploading ${progress.percent}%`,
      updatedAt: prev.updatedAt,
    });
    return;
  }
  lastProgressEmitAt = now;
  lastProgressPercent = progress.percent;
  upsertSyncActivity({
    ...prev,
    status: "uploading",
    percent: progress.percent,
    detail: `Uploading ${progress.percent}%`,
  });
}

export function finishUploadActivity(
  id: string,
  outcome: "done" | "error" | "pending",
  detail?: string
): void {
  const prev = items.get(id);
  if (!prev) return;
  if (activeUploadId === id) activeUploadId = null;
  if (outcome === "done") {
    upsertSyncActivity({
      ...prev,
      status: "done",
      percent: 100,
      detail: "Synced",
    });
    scheduleRemove(id, 2_400);
    return;
  }
  if (outcome === "pending") {
    upsertSyncActivity({
      ...prev,
      kind: "retry",
      status: "pending",
      detail: detail ?? "Will retry…",
    });
    return;
  }
  upsertSyncActivity({
    ...prev,
    status: "error",
    detail: detail ?? "Failed",
  });
}

export function upsertQueuedUploadActivity(input: {
  pageId: string;
  title: string;
  detail?: string;
  error?: boolean;
  silent?: boolean;
}): boolean {
  return upsertSyncActivity(
    {
      id: `queued-upload:${input.pageId}`,
      kind: "retry",
      title: input.title.trim() || "Upload",
      status: input.error ? "error" : "pending",
      detail: input.detail ?? (input.error ? "Retrying…" : "Waiting to upload…"),
    },
    { silent: input.silent }
  );
}

export function upsertQueuedMutationActivity(input: {
  id: string;
  title: string;
  detail?: string;
  silent?: boolean;
}): boolean {
  return upsertSyncActivity(
    {
      id: `queued-mut:${input.id}`,
      kind: "mutation",
      title: input.title,
      status: "pending",
      detail: input.detail ?? "Waiting to sync…",
    },
    { silent: input.silent }
  );
}

export function clearFinishedSyncActivities(): void {
  for (const item of [...items.values()]) {
    if (item.status === "done") removeSyncActivity(item.id);
  }
}

export function activityStatusLabel(item: SyncActivityItem): string {
  if (item.detail) return item.detail;
  switch (item.status) {
    case "preparing":
      return "Preparing…";
    case "uploading":
      return item.percent != null ? `Uploading ${item.percent}%` : "Uploading…";
    case "finalizing":
      return "Saving…";
    case "pending":
      return "Waiting…";
    case "error":
      return "Not synced";
    case "done":
      return "Synced";
  }
}
