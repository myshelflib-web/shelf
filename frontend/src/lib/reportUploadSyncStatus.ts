import type { UploadProgress } from "@/lib/api";
import { dispatchSyncStatus } from "@/lib/syncStatus";

/** Mirror add-modal upload progress into the header sync chip. */
export function reportSyncFromUploadProgress(progress: UploadProgress): void {
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

export function reportSyncUploadDone(): void {
  dispatchSyncStatus({ state: "synced", label: "Synced" });
}

export function reportSyncUploadFailed(message?: string): void {
  dispatchSyncStatus({
    state: "error",
    label: message ? "Upload failed" : "Not synced",
  });
}
