import type { UploadProgress } from "@/lib/api";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import {
  applyUploadProgressToActivity,
  beginUploadActivity,
  finishUploadActivity,
  getActiveUploadActivityId,
  removeSyncActivity,
} from "@/lib/syncActivityStore";

/** Mirror add-modal upload progress into the header sync chip + activity list. */
export function reportSyncFromUploadProgress(progress: UploadProgress): void {
  applyUploadProgressToActivity(progress);
  if (progress.phase === "compressing") {
    dispatchSyncStatus({ state: "saving", label: "Preparing…" });
    return;
  }
  if (progress.phase === "finalizing") {
    dispatchSyncStatus({ state: "saving", label: "Saving…" });
    return;
  }
  dispatchSyncStatus({
    state: "uploading",
    label: "Uploading",
    percent: progress.percent,
  });
}

/** Start (or replace) the active upload row shown in the sync dropdown. */
export function reportSyncUploadStarted(title: string): string {
  const id = beginUploadActivity(title);
  dispatchSyncStatus({ state: "uploading", label: "Uploading", percent: 0 });
  return id;
}

export function reportSyncUploadDone(activityId?: string | null): void {
  const id = activityId ?? getActiveUploadActivityId();
  if (id) finishUploadActivity(id, "done");
  dispatchSyncStatus({ state: "synced", label: "Synced" });
}

/** Local bytes kept; background queue will retry PUT/complete (unless CORS). */
export function reportSyncUploadDeferred(
  activityId?: string | null,
  detail?: string
): void {
  const id = activityId ?? getActiveUploadActivityId();
  // Live row is replaced by the durable queued-upload:* entry.
  if (id) removeSyncActivity(id);
  const cors =
    Boolean(detail) &&
    /CORS|Cannot reach storage/i.test(detail!);
  dispatchSyncStatus({
    state: "error",
    label: cors ? "Not synced" : "Upload pending…",
  });
}

export function reportSyncUploadFailed(
  message?: string,
  activityId?: string | null
): void {
  const id = activityId ?? getActiveUploadActivityId();
  if (id) finishUploadActivity(id, "error", message ?? "Upload failed");
  dispatchSyncStatus({
    state: "error",
    label: message ? "Upload failed" : "Not synced",
  });
}
