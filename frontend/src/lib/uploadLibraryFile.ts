import { compressUploadFile, shouldCompressUpload } from "@/lib/compressUploadFile";
import {
  decidePdfCompress,
  shouldAttemptPdfCompress,
} from "@/lib/pdfCompressDecision";
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
import { scheduleFlushPendingUploads } from "@/lib/flushPendingUploads";
import { markEntitiesFailed } from "@/lib/entitySyncState";
import { upsertQueuedUploadActivity } from "@/lib/syncActivityStore";
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

async function prepareUploadFile(
  file: File,
  onProgress?: UploadProgressHandler
): Promise<{ toUpload: File; clientPacked: boolean }> {
  if (isPdfFile(file)) {
    const decision = decidePdfCompress(file);
    const attempt = decision.attempt && (await shouldAttemptPdfCompress(file));
    if (attempt) {
      onProgress?.({
        loaded: 0,
        total: file.size,
        percent: 0,
        phase: "compressing",
      });
      const toUpload = await compressUploadFile(file);
      return { toUpload, clientPacked: true };
    }
    return { toUpload: file, clientPacked: decision.clientPacked };
  }

  const clientPacked = shouldCompressUpload(file);
  if (clientPacked) {
    onProgress?.({
      loaded: 0,
      total: file.size,
      percent: 0,
      phase: "compressing",
    });
  }
  const toUpload = await compressUploadFile(file);
  return { toUpload, clientPacked };
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
  lastError?: string;
}): Promise<void> {
  const userId = getStoredUserId();
  if (!userId) return;
  const data = await input.toUpload.arrayBuffer();
    await putPendingUpload({
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
      attempts: 0,
      nextAttemptAt: Date.now() + pendingUploadBackoffMs(0),
      lastError: input.lastError,
    });
    markEntitiesFailed([`page:${input.pageId}`]);
    upsertQueuedUploadActivity({
      pageId: input.pageId,
      title: input.title,
      detail: input.lastError ?? "Will retry…",
      error: Boolean(input.lastError),
    });
    scheduleFlushPendingUploads(pendingUploadBackoffMs(0));
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
    request,
    putToUrl,
    deletePage,
    onDraftAbandoned,
  } = opts;
  const { toUpload, clientPacked } = await prepareUploadFile(file, onProgress);
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

  // Seed + open before PUT so CORS/network failures never yank a flash-open tab.
  if (earlyPage?.id && onEarlyReady) {
    if (contentType === "PDF" && earlyVersion) {
      await seedPdfByteCache(earlyPage.id, earlyVersion, toUpload);
    }
    const content = await earlyHtmlForUploadFile(toUpload, contentType);
    onEarlyReady({
      page: earlyPage,
      pdfCacheVersion: earlyVersion,
      openSeed: {
        contentType,
        title: earlyPage.title || title,
        ...(content ? { content } : {}),
      },
    });
  }

  const deferKeepLocal = async (
    putDone: boolean,
    err: unknown
  ): Promise<UploadLibraryResult | null> => {
    if (!earlyPage?.id) return null;
    const message = err instanceof Error ? err.message : "Upload failed";
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
        lastError: message,
      });
    } catch {
      return null;
    }
    return {
      page: earlyPage,
      pdfCacheVersion: earlyVersion,
      deferred: true,
      message:
        "Saved on this device. Upload will retry automatically when storage is reachable.",
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
    if (version) {
      await seedPdfByteCache(done.page.id, version, toUpload);
    }
    return {
      page: { ...done.page, contentType: done.page.contentType ?? "PDF" },
      message: done.message ?? "PDF uploaded. Open the page to read it.",
      pdfCacheVersion: version,
    };
  }

  return done;
}
