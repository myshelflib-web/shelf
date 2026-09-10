import { compressUploadFile, shouldCompressUpload } from "@/lib/compressUploadFile";
import {
  decidePdfCompress,
  shouldAttemptPdfCompress,
} from "@/lib/pdfCompressDecision";
import { seedPdfByteCache } from "@/lib/seedPdfByteCache";
import type { UserPageSummary } from "@/types";

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
  phase?: "compressing" | "uploading" | "finalizing";
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

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
  const name = file.name.toLowerCase();
  const mime = (file.type || "").toLowerCase();
  return name.endsWith(".pdf") || mime === "application/pdf";
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
 * Direct-to-S3 library upload. PDFs create a draft on init (hidden from lists)
 * so we can seed the byte cache; complete must succeed before we return so the
 * explorer never sees a row that later vanishes.
 */
export async function uploadLibraryFile(opts: {
  file: File;
  title: string;
  scope: { subjectId?: string; topicGroupId?: string };
  onProgress?: UploadProgressHandler;
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
    request,
    putToUrl,
    deletePage,
    onDraftAbandoned,
  } = opts;
  const { toUpload, clientPacked } = await prepareUploadFile(file, onProgress);

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

  const earlyPage = init.page;
  const earlyVersion = init.pdfCacheVersion;

  onProgress?.({
    loaded: toUpload.size,
    total: toUpload.size,
    percent: 100,
    phase: "finalizing",
  });

  if (earlyPage?.id && earlyVersion && isPdfFile(toUpload)) {
    const seedPromise = seedPdfByteCache(earlyPage.id, earlyVersion, toUpload);
    try {
      const done = await completeUploadWithRetry<{
        page: UserPageSummary;
        message?: string;
        pdfCacheVersion?: string;
      }>(request, init.token);
      await seedPromise;
      const version = done.pdfCacheVersion ?? earlyVersion;
      if (version !== earlyVersion) {
        await seedPdfByteCache(done.page.id, version, toUpload);
      }
      return {
        page: { ...done.page, contentType: done.page.contentType ?? "PDF" },
        message: done.message ?? "PDF uploaded. Open the page to read it.",
        pdfCacheVersion: version,
      };
    } catch (err) {
      await abandonDraft();
      throw err;
    }
  }

  try {
    const done = await completeUploadWithRetry<{
      page: UserPageSummary;
      message?: string;
      pdfCacheVersion?: string;
    }>(request, init.token);

    if (done.page?.id && done.pdfCacheVersion && isPdfFile(toUpload)) {
      await seedPdfByteCache(done.page.id, done.pdfCacheVersion, toUpload);
    }

    return done;
  } catch (err) {
    await abandonDraft();
    throw err;
  }
}
