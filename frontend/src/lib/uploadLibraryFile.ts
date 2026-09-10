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
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * Direct-to-S3 library upload. After init, calls `onEarlyReady` so the reader
 * can open from local cache/seed while PUT + complete continue.
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
}): Promise<{ page: UserPageSummary; message?: string; pdfCacheVersion?: string }> {
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
    if (deletePage) {
      await deletePage(init.page.id).catch(() => undefined);
    }
    onDraftAbandoned?.(init.page.id);
  };

  const earlyPage = init.page
    ? {
        ...init.page,
        contentType: init.page.contentType ?? contentType,
      }
    : undefined;
  const earlyVersion = init.pdfCacheVersion;

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

  try {
    await putToUrl(
      init.uploadUrl,
      toUpload,
      init.headers["Content-Type"],
      onProgress
    );
  } catch (err) {
    await abandonDraft();
    throw err;
  }

  onProgress?.({
    loaded: toUpload.size,
    total: toUpload.size,
    percent: 100,
    phase: "finalizing",
  });

  try {
    const done = await completeUploadWithRetry<{
      page: UserPageSummary;
      message?: string;
      pdfCacheVersion?: string;
    }>(request, init.token);

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
  } catch (err) {
    await abandonDraft();
    throw err;
  }
}
