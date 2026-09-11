/**
 * Tab-session registry of bulk-import files that failed before/during upload.
 * Keeps File handles so Sync → Retry failed can re-run without re-picking folders.
 */

import { mapWithConcurrency } from "@/lib/mapWithConcurrency";
import { pageHref } from "@/lib/myContentTree";
import { emitContentChanged } from "@/lib/contentEvents";
import {
  listSyncActivities,
  removeSyncActivity,
  upsertSyncActivity,
} from "@/lib/syncActivityStore";
import { dispatchOfflineSync } from "@/lib/offline/network";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import { api } from "@/lib/api";
import { randomId } from "@/lib/randomId";
import type { UserPageSummary } from "@/types";

export const FAILED_BULK_ACTIVITY_PREFIX = "failed-bulk:";

export type FailedBulkUpload = {
  id: string;
  batchId: string;
  file: File;
  title: string;
  notebookId: string;
  notebookSlug: string;
  topicGroupId?: string;
  topicSlug: string | null;
  lastError: string;
  createdAt: number;
};

const byId = new Map<string, FailedBulkUpload>();

export function failedBulkActivityId(id: string): string {
  return `${FAILED_BULK_ACTIVITY_PREFIX}${id}`;
}

export function rememberFailedBulkUpload(
  input: Omit<FailedBulkUpload, "id" | "createdAt"> & { id?: string }
): FailedBulkUpload {
  const entry: FailedBulkUpload = {
    ...input,
    id: input.id ?? randomId(),
    createdAt: Date.now(),
  };
  byId.set(entry.id, entry);
  upsertSyncActivity({
    id: failedBulkActivityId(entry.id),
    kind: "retry",
    title: entry.title || entry.file.name,
    status: "error",
    detail: entry.lastError,
  });
  dispatchOfflineSync();
  return entry;
}

export function listFailedBulkUploads(): FailedBulkUpload[] {
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}

export function countFailedBulkUploads(): number {
  return byId.size;
}

export function removeFailedBulkUpload(id: string): void {
  if (!byId.delete(id)) return;
  removeSyncActivity(failedBulkActivityId(id));
  dispatchOfflineSync();
}

export function removeFailedBulkUploadByActivityId(activityId: string): boolean {
  if (!activityId.startsWith(FAILED_BULK_ACTIVITY_PREFIX)) return false;
  removeFailedBulkUpload(activityId.slice(FAILED_BULK_ACTIVITY_PREFIX.length));
  return true;
}

export function formatBulkImportSummary(input: {
  succeeded: number;
  failed: number;
  total: number;
  sampleNames?: string[];
}): { title: string; detail: string } {
  const { succeeded, failed, total, sampleNames = [] } = input;
  if (failed === 0) {
    return {
      title: total === 1 ? "Uploaded" : `Imported ${succeeded} files`,
      detail: "All files uploaded",
    };
  }
  if (succeeded === 0) {
    return {
      title: `Import failed · ${failed} file${failed === 1 ? "" : "s"}`,
      detail: "Nothing uploaded — use Retry failed",
    };
  }
  const samples = sampleNames.slice(0, 3).join(", ");
  const more =
    sampleNames.length > 3 ? ` +${sampleNames.length - 3} more` : "";
  return {
    title: `Import · ${succeeded} of ${total}`,
    detail: `${failed} failed${samples ? `: ${samples}${more}` : ""} — Retry failed`,
  };
}

const RETRY_CONCURRENCY = 3;

/** Re-upload session-failed bulk files only (not IDB deferred). */
export async function retryFailedBulkUploads(): Promise<{
  succeeded: number;
  failed: number;
}> {
  const jobs = listFailedBulkUploads();
  if (jobs.length === 0) return { succeeded: 0, failed: 0 };

  dispatchSyncStatus({ state: "uploading", label: "Retrying…", percent: 0 });
  let succeeded = 0;
  let failed = 0;

  await mapWithConcurrency(jobs, RETRY_CONCURRENCY, async (job) => {
    const activityId = failedBulkActivityId(job.id);
    upsertSyncActivity({
      id: activityId,
      kind: "retry",
      title: job.title || job.file.name,
      status: "uploading",
      percent: 0,
      detail: "Retrying…",
    });
    const fd = new FormData();
    fd.append("file", job.file);
    fd.append("title", job.title);
    try {
      const result = job.topicGroupId
        ? await api.myContent.uploadFile(
            job.notebookId,
            job.topicGroupId,
            fd,
            undefined,
            undefined,
            { seedPdfCache: false }
          )
        : await api.myContent.uploadNotebookFile(
            job.notebookId,
            fd,
            undefined,
            undefined,
            { seedPdfCache: false }
          );
      const page = result.page as UserPageSummary;
      const href = pageHref(job.notebookSlug, job.topicSlug, page.slug);
      if (!result.deferred) {
        emitContentChanged({
          type: "page-created",
          page,
          href,
          notebookId: job.notebookId,
          notebookSlug: job.notebookSlug,
          topicId: job.topicGroupId,
          topicSlug: job.topicSlug,
        });
      }
      removeFailedBulkUpload(job.id);
      succeeded += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Upload failed";
      byId.set(job.id, { ...job, lastError: message });
      upsertSyncActivity({
        id: activityId,
        kind: "retry",
        title: job.title || job.file.name,
        status: "error",
        detail: message,
      });
    }
  });

  if (failed === 0 && succeeded > 0) {
    // Mark leftover batch summaries as done when every failed file recovered.
    for (const item of listSyncActivities()) {
      if (item.id.startsWith("bulk:") && item.status === "error") {
        upsertSyncActivity({
          ...item,
          status: "done",
          detail: "All failed files uploaded",
        });
      }
    }
  }

  dispatchSyncStatus(
    failed > 0
      ? { state: "error", label: "Not synced" }
      : { state: "synced", label: "Synced" }
  );
  dispatchOfflineSync();
  return { succeeded, failed };
}
