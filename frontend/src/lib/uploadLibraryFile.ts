import {
  contentTypeFromUploadFile,
  earlyHtmlForUploadFile,
} from "@/lib/earlyUploadOpen";
import { seedPdfByteCache } from "@/lib/seedPdfByteCache";
import { getStoredUserId } from "@/lib/accountLocalState";
import {
  pendingUploadBackoffMs,
  putPendingUpload,
} from "@/lib/pendingUploadQueue";
import { putSessionDeferredUpload } from "@/lib/sessionDeferredUploads";
import { scheduleFlushPendingUploads } from "@/lib/flushPendingUploads";
import { markEntitiesFailed } from "@/lib/entitySyncState";
import { upsertQueuedUploadActivity } from "@/lib/syncActivityStore";
import {
  MAX_SYNC_RETRY_ATTEMPTS,
  STORAGE_CORS_STOP_MESSAGE,
  SYNC_RETRY_EXHAUSTED_AT,
  isStorageCorsOrUnreachableError,
} from "@/lib/syncBackoff";
import { dispatchOfflineSync } from "@/lib/offline/network";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import type { UserContentType, UserPageSummary } from "@/types";

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
  phase?: "compressing" | "uploading" | "finalizing";
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

export type UploadEarlyReady = {
  page: UserPageSummary;
  pdfCacheVersion?: string;
  openSeed: {
    contentType: UserContentType;
    title: string;
    content?: string;
  };
};

export type UploadLibraryResult = {
  page: UserPageSummary;
  message?: string;
  pdfCacheVersion?: string;
  /** PUT/complete deferred to IndexedDB retry queue — tab stays open. */
  deferred?: boolean;
};

type RequestFn = <T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
) => Promise<T>;

type PutFn = (
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: UploadProgressHandler
) => Promise<void>;

function isPdfFile(file: File): boolean {
  return contentTypeFromUploadFile(file) === "PDF";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Library uploads skip browser packing — S3 receives the original bytes and the
 * API re-packs in the background after complete (including IndexedDB flushes).
 */
function prepareUploadFile(file: File): { toUpload: File; clientPacked: boolean } {
  return { toUpload: file, clientPacked: false };
}

async function completeUploadWithRetry<T>(
  request: RequestFn,
  token: string,
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await request<T>("/api/my-content/uploads/complete", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await sleep(400 * (i + 1));
      }
    }
  }
  throw lastErr;
}

async function putWithBackoff(
  putToUrl: PutFn,
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: UploadProgressHandler,
  attempts = 2
): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      await putToUrl(url, body, contentType, onProgress);
      return;
    } catch (err) {
      lastErr = err;
      // CORS / unreachable storage will not heal with another immediate PUT.
      if (isStorageCorsOrUnreachableError(err)) throw err;
      if (i < attempts - 1) {
        await sleep(pendingUploadBackoffMs(i));
      }
    }
  }
  throw lastErr;
}

async function enqueueDeferredUpload(input: {
  pageId: string;
  token: string;
  uploadUrl: string;
  contentTypeHeader: string;
  toUpload: File;
  title: string;
  contentType: UserContentType;
  pdfCacheVersion?: string;
  clientPacked: boolean;
  putDone: boolean;
  cause?: unknown;
  lastError?: string;
}): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) return;
  const cors = isStorageCorsOrUnreachableError(input.cause);
  const lastError = cors
    ? STORAGE_CORS_STOP_MESSAGE
    : input.lastError ?? "Upload failed";

  let stored = false;
  try {
    const data = await input.toUpload.arrayBuffer();
    stored = await putPendingUpload({
      pageId: input.pageId,
      userId,
      token: input.token,
      uploadUrl: input.uploadUrl,
      contentTypeHeader: input.contentTypeHeader,
      filename: input.toUpload.name,
      title: input.title,
      contentType: input.contentType,
      pdfCacheVersion: input.pdfCacheVersion,
      clientPacked: input.clientPacked,
      putDone: input.putDone,
      data,
      createdAt: Date.now(),
      attempts: cors ? MAX_SYNC_RETRY_ATTEMPTS : 0,
      nextAttemptAt: cors
        ? SYNC_RETRY_EXHAUSTED_AT
        : Date.now() + pendingUploadBackoffMs(0),
      lastError,
    });
  } catch {
    stored = false;
  }

  if (!stored) {
    // IndexedDB full / eviction — keep File in this tab until sync succeeds.
    putSessionDeferredUpload({
      pageId: input.pageId,
      userId,
      token: input.token,
      uploadUrl: input.uploadUrl,
      contentTypeHeader: input.contentTypeHeader,
      filename: input.toUpload.name,
      title: input.title,
      contentType: input.contentType,
      pdfCacheVersion: input.pdfCacheVersion,
      clientPacked: input.clientPacked,
      putDone: input.putDone,
      file: input.toUpload,
      createdAt: Date.now(),
      lastError:
        lastError === STORAGE_CORS_STOP_MESSAGE
          ? lastError
          : `${lastError} (kept in this tab — device storage is full)`,
    });
    return;
  }

  markEntitiesFailed([`page:${input.pageId}`]);
  upsertQueuedUploadActivity({
    pageId: input.pageId,
    title: input.title,
    detail: lastError,
    error: true,
  });
  dispatchSyncStatus({ state: "error", label: "Not synced" });
  dispatchOfflineSync();
  // CORS cannot be fixed by retry — do not schedule background flushes.
  if (!cors) {
    scheduleFlushPendingUploads(pendingUploadBackoffMs(0));
  }
}

/**
 * Direct-to-S3 library upload. Opens the reader from local cache as soon as
 * the draft exists; on PUT/complete failure keeps local bytes and retries
 * with backoff instead of abandoning the draft / closing the tab.
 */
export async function uploadLibraryFile(opts: {
  file: File;
  title: string;
  scope: { subjectId?: string; topicGroupId?: string };
  onProgress?: UploadProgressHandler;
  onEarlyReady?: (early: UploadEarlyReady) => void;
  /** Default true. Bulk imports skip so hundreds of PDFs do not fill IDB. */
  seedPdfCache?: boolean;
  request: RequestFn;
  putToUrl: PutFn;
  deletePage?: (id: string) => Promise<unknown>;
  onDraftAbandoned?: (pageId: string) => void;
}): Promise<UploadLibraryResult> {
  const {
    file,
    title,
    scope,
    onProgress,
    onEarlyReady,
    seedPdfCache = true,
    request,
    putToUrl,
    deletePage,
    onDraftAbandoned,
  } = opts;
  const { toUpload, clientPacked } = prepareUploadFile(file);
  const contentType = contentTypeFromUploadFile(toUpload);

  const init = await request<{
    uploadUrl: string;
    headers: { "Content-Type": string };
    token: string;
    page?: UserPageSummary;
    pdfCacheVersion?: string;
  }>("/api/my-content/uploads/init", {
    method: "POST",
    body: JSON.stringify({
      title,
      filename: toUpload.name,
      contentType: toUpload.type || "application/octet-stream",
      size: toUpload.size,
      subjectId: scope.subjectId,
      topicGroupId: scope.topicGroupId,
      clientPacked,
    }),
  });

  const abandonDraft = async () => {
    if (!init.page?.id) return;
    let shouldNotify = true;
    if (deletePage) {
      try {
        const res = (await deletePage(init.page.id)) as { skipped?: boolean };
        if (res?.skipped) shouldNotify = false;
      } catch {
        /* draft may already be gone */
      }
    }
    if (shouldNotify) onDraftAbandoned?.(init.page.id);
  };

  const earlyPage = init.page
    ? {
        ...init.page,
        contentType: init.page.contentType ?? contentType,
      }
    : undefined;
  const earlyVersion = init.pdfCacheVersion;

  // Open the reader immediately; seed IndexedDB in the background so PUT
  // is never blocked by getAll/arrayBuffer of large PDF caches.
  if (earlyPage?.id && onEarlyReady) {
    if (seedPdfCache && contentType === "PDF" && earlyVersion) {
      void seedPdfByteCache(earlyPage.id, earlyVersion, toUpload);
    }
    if (contentType === "PDF") {
      onEarlyReady({
        page: earlyPage,
        pdfCacheVersion: earlyVersion,
        openSeed: {
          contentType,
          title: earlyPage.title || title,
        },
      });
    } else {
      void earlyHtmlForUploadFile(toUpload, contentType).then((content) => {
        onEarlyReady({
          page: earlyPage,
          pdfCacheVersion: earlyVersion,
          openSeed: {
            contentType,
            title: earlyPage.title || title,
            ...(content ? { content } : {}),
          },
        });
      });
    }
  }

  const deferKeepLocal = async (
    putDone: boolean,
    err: unknown
  ): Promise<UploadLibraryResult | null> => {
    if (!earlyPage?.id) return null;
    const cors = isStorageCorsOrUnreachableError(err);
    const message = cors
      ? STORAGE_CORS_STOP_MESSAGE
      : err instanceof Error
        ? err.message
        : "Upload failed";
    try {
      await enqueueDeferredUpload({
        pageId: earlyPage.id,
        token: init.token,
        uploadUrl: init.uploadUrl,
        contentTypeHeader: init.headers["Content-Type"],
        toUpload,
        title: earlyPage.title || title,
        contentType,
        pdfCacheVersion: earlyVersion,
        clientPacked,
        putDone,
        cause: err,
        lastError: message,
      });
    } catch {
      return null;
    }
    return {
      page: earlyPage,
      pdfCacheVersion: earlyVersion,
      deferred: true,
      message: cors
        ? STORAGE_CORS_STOP_MESSAGE
        : "Saved on this device. Upload will retry automatically when storage is reachable.",
    };
  };

  try {
    await putWithBackoff(
      putToUrl,
      init.uploadUrl,
      toUpload,
      init.headers["Content-Type"],
      onProgress
    );
  } catch (err) {
    const deferred = await deferKeepLocal(false, err);
    if (deferred) return deferred;
    await abandonDraft();
    throw err;
  }

  onProgress?.({
    loaded: toUpload.size,
    total: toUpload.size,
    percent: 100,
    phase: "finalizing",
  });

  let done: {
    page: UserPageSummary;
    message?: string;
    pdfCacheVersion?: string;
  };
  try {
    done = await completeUploadWithRetry<{
      page: UserPageSummary;
      message?: string;
      pdfCacheVersion?: string;
    }>(request, init.token);
  } catch (err) {
    const deferred = await deferKeepLocal(true, err);
    if (deferred) return deferred;
    await abandonDraft();
    throw err;
  }

  if (done.page?.id && contentType === "PDF") {
    const version = done.pdfCacheVersion ?? earlyVersion;
    if (seedPdfCache && version) {
      void seedPdfByteCache(done.page.id, version, toUpload);
    }
    return {
      page: { ...done.page, contentType: done.page.contentType ?? "PDF" },
      message: done.message ?? "PDF uploaded. Open the page to read it.",
      pdfCacheVersion: version,
    };
  }

  return done;
}
