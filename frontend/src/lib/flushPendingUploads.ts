import { ApiError, api } from "@/lib/api";
import { getStoredUserId } from "@/lib/accountLocalState";
import { seedPdfByteCache } from "@/lib/seedPdfByteCache";
import {
  clearEntitiesFailed,
  markEntitiesFailed,
} from "@/lib/entitySyncState";
import { removeSyncActivity } from "@/lib/syncActivityStore";
import { dispatchOfflineSync, isOnline } from "@/lib/offline/network";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import {
  listDuePendingUploads,
  listPendingUploads,
  pendingUploadBackoffMs,
  putPendingUpload,
  removePendingUpload,
  type PendingUploadEntry,
} from "@/lib/pendingUploadQueue";
import {
  MAX_SYNC_RETRY_ATTEMPTS,
  SYNC_RETRY_EXHAUSTED_AT,
  STORAGE_CORS_STOP_MESSAGE,
  isStorageCorsOrUnreachableError,
  isSyncRetryExhausted,
  syncRetryExhaustedMessage,
} from "@/lib/syncBackoff";
import { upsertQueuedUploadActivity } from "@/lib/syncActivityStore";

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

function soonestUploadRetryAt(
  entries: PendingUploadEntry[]
): number | null {
  const active = entries.filter(
    (e) =>
      !isSyncRetryExhausted(e.attempts) &&
      e.nextAttemptAt < SYNC_RETRY_EXHAUSTED_AT &&
      !(e.lastError && /CORS|Cannot reach storage/i.test(e.lastError))
  );
  if (active.length === 0) return null;
  return Math.min(...active.map((e) => e.nextAttemptAt));
}

function putBlob(
  url: string,
  body: Blob,
  contentType: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new ApiError("Upload to storage failed", xhr.status));
    };
    xhr.onerror = () => {
      reject(
        new ApiError(
          "Cannot reach storage. Check that MinIO/R2 is running and bucket CORS allows this site.",
          0
        )
      );
    };
    xhr.send(body);
  });
}

async function bumpBackoff(
  entry: PendingUploadEntry,
  err: unknown
): Promise<number> {
  const cors = isStorageCorsOrUnreachableError(err);
  const attempts = cors ? MAX_SYNC_RETRY_ATTEMPTS : entry.attempts + 1;
  const message = cors
    ? STORAGE_CORS_STOP_MESSAGE
    : err instanceof Error
      ? err.message
      : "Upload retry failed";
  markEntitiesFailed([`page:${entry.pageId}`]);

  if (cors || isSyncRetryExhausted(attempts)) {
    await putPendingUpload({
      ...entry,
      attempts: Math.max(attempts, MAX_SYNC_RETRY_ATTEMPTS),
      nextAttemptAt: SYNC_RETRY_EXHAUSTED_AT,
      lastError: cors ? STORAGE_CORS_STOP_MESSAGE : syncRetryExhaustedMessage("upload"),
    });
    upsertQueuedUploadActivity({
      pageId: entry.pageId,
      title: entry.title || entry.filename,
      detail: cors
        ? STORAGE_CORS_STOP_MESSAGE
        : syncRetryExhaustedMessage("upload"),
      error: true,
    });
    dispatchSyncStatus({
      state: "error",
      label: "Not synced",
    });
    dispatchOfflineSync();
    return -1;
  }

  const delayMs = pendingUploadBackoffMs(attempts);
  await putPendingUpload({
    ...entry,
    attempts,
    nextAttemptAt: Date.now() + delayMs,
    lastError: message,
  });
  upsertQueuedUploadActivity({
    pageId: entry.pageId,
    title: entry.title || entry.filename,
    detail: `Retry ${attempts}/${MAX_SYNC_RETRY_ATTEMPTS}…`,
    error: true,
  });
  dispatchSyncStatus({
    state: "error",
    label: "Not synced",
  });
  dispatchOfflineSync();
  return delayMs;
}

async function flushOne(entry: PendingUploadEntry): Promise<boolean> {
  let token = entry.token;
  let uploadUrl = entry.uploadUrl;
  let contentTypeHeader = entry.contentTypeHeader;
  let pdfCacheVersion = entry.pdfCacheVersion;
  let putDone = entry.putDone;

  const blob = new Blob([entry.data], {
    type: contentTypeHeader || "application/octet-stream",
  });

  const refreshCreds = async () => {
    const resumed = await api.myContent.resumeUpload(entry.pageId, {
      clientPacked: entry.clientPacked,
    });
    token = resumed.token;
    uploadUrl = resumed.uploadUrl;
    contentTypeHeader = resumed.headers["Content-Type"] || contentTypeHeader;
    pdfCacheVersion = resumed.pdfCacheVersion ?? pdfCacheVersion;
  };

  try {
    await refreshCreds();
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await removePendingUpload(entry.pageId);
      return false;
    }
    // Keep stored credentials if resume is briefly unavailable.
    if (!(err instanceof ApiError)) throw err;
  }

  if (!putDone) {
    await putBlob(uploadUrl, blob, contentTypeHeader);
    putDone = true;
    await putPendingUpload({
      ...entry,
      token,
      uploadUrl,
      contentTypeHeader,
      pdfCacheVersion,
      putDone: true,
      lastError: undefined,
    });
  }

  try {
    const done = await api.myContent.completeUpload(token);
    if (done.page?.id && entry.contentType === "PDF") {
      const version = done.pdfCacheVersion ?? pdfCacheVersion;
      if (version) {
        await seedPdfByteCache(done.page.id, version, blob);
      }
    }
    if (done.page) {
      void import("@/lib/contentEvents").then(({ emitContentChanged }) => {
        emitContentChanged();
      });
    }
  } catch (err) {
    // Token may still be stale if resume was skipped — refresh once and retry complete.
    if (err instanceof ApiError && err.status === 400) {
      await refreshCreds();
      if (!putDone) {
        await putBlob(uploadUrl, blob, contentTypeHeader);
        putDone = true;
      }
      const done = await api.myContent.completeUpload(token);
      if (done.page?.id && entry.contentType === "PDF") {
        const version = done.pdfCacheVersion ?? pdfCacheVersion;
        if (version) {
          await seedPdfByteCache(done.page.id, version, blob);
        }
      }
      if (done.page) {
        void import("@/lib/contentEvents").then(({ emitContentChanged }) => {
          emitContentChanged();
        });
      }
    } else {
      throw err;
    }
  }

  await removePendingUpload(entry.pageId);
  clearEntitiesFailed([`page:${entry.pageId}`]);
  removeSyncActivity(`queued-upload:${entry.pageId}`);
  return true;
}

/** Run due pending uploads; schedules the next wake when more remain. */
export async function flushPendingUploads(): Promise<number> {
  const userId = getStoredUserId();
  if (!userId || !isOnline() || flushing) return 0;
  flushing = true;
  let synced = 0;
  let scheduledDelayMs: number | null = null;
  try {
    const due = await listDuePendingUploads(userId);
    if (due.length === 0) {
      const remaining = await listPendingUploads(userId);
      const nextAt = soonestUploadRetryAt(remaining);
      if (nextAt != null) {
        // Never use a 0 delay for a future-dated retry (clock skew / race).
        scheduleFlushPendingUploads(Math.max(250, nextAt - Date.now()));
      }
      return 0;
    }

    dispatchSyncStatus({ state: "uploading", label: "Retrying upload…" });
    for (const entry of due) {
      try {
        if (await flushOne(entry)) synced += 1;
      } catch (err) {
        // Always apply backoff — CORS/network errors used to skip this and
        // reschedule with delay 0, which hammered storage in a tight loop.
        const delayMs = await bumpBackoff(entry, err);
        if (delayMs > 0) {
          scheduledDelayMs =
            scheduledDelayMs == null
              ? delayMs
              : Math.min(scheduledDelayMs, delayMs);
        }
        if (!isOnline()) break;
      }
    }

    const remaining = await listPendingUploads(userId);
    if (remaining.length === 0) {
      if (synced > 0) {
        dispatchSyncStatus({ state: "synced", label: "Synced" });
      }
    } else {
      const nextAt = soonestUploadRetryAt(remaining);
      if (nextAt != null) {
        dispatchSyncStatus({
          state: "error",
          label: "Not synced",
        });
        const fromQueue = Math.max(250, nextAt - Date.now());
        const delayMs =
          scheduledDelayMs != null
            ? Math.max(fromQueue, scheduledDelayMs)
            : fromQueue;
        scheduleFlushPendingUploads(delayMs);
      } else {
        dispatchSyncStatus({
          state: "error",
          label: "Not synced",
        });
      }
    }
    if (synced > 0) dispatchOfflineSync();
    return synced;
  } finally {
    flushing = false;
  }
}

export function scheduleFlushPendingUploads(delayMs = 0): void {
  if (typeof window === "undefined") return;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushPendingUploads();
  }, Math.max(0, delayMs));
}
