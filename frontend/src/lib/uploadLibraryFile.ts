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

/**
 * Direct-to-S3 library upload. PDFs create a draft on init so we can seed the
 * byte cache and open the reader after PUT while complete finalizes in the
 * background.
 */
export async function uploadLibraryFile(opts: {
  file: File;
  title: string;
  scope: { subjectId?: string; topicGroupId?: string };
  onProgress?: UploadProgressHandler;
  request: RequestFn;
  putToUrl: PutFn;
  deletePage?: (id: string) => Promise<unknown>;
}): Promise<{ page: UserPageSummary; message?: string; pdfCacheVersion?: string }> {
  const { file, title, scope, onProgress, request, putToUrl, deletePage } = opts;
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

  try {
    await putToUrl(
      init.uploadUrl,
      toUpload,
      init.headers["Content-Type"],
      onProgress
    );
  } catch (err) {
    if (init.page?.id && deletePage) {
      await deletePage(init.page.id).catch(() => undefined);
    }
    throw err;
  }

  const earlyPage = init.page;
  const earlyVersion = init.pdfCacheVersion;

  if (earlyPage?.id && earlyVersion && isPdfFile(toUpload)) {
    onProgress?.({
      loaded: toUpload.size,
      total: toUpload.size,
      percent: 100,
      phase: "finalizing",
    });
    const seedPromise = seedPdfByteCache(earlyPage.id, earlyVersion, toUpload);
    void request<{
      page: UserPageSummary;
      message?: string;
      pdfCacheVersion?: string;
    }>("/api/my-content/uploads/complete", {
      method: "POST",
      body: JSON.stringify({ token: init.token }),
    })
      .then(async (done) => {
        if (!done?.pdfCacheVersion || done.pdfCacheVersion === earlyVersion) {
          return;
        }
        await seedPdfByteCache(earlyPage.id, done.pdfCacheVersion, toUpload);
      })
      .catch((err: unknown) => {
        if (typeof console !== "undefined") {
          console.warn(
            "[shelf] upload complete failed",
            err instanceof Error ? err.message : err
          );
        }
      });

    await seedPromise;

    return {
      page: earlyPage,
      message: "PDF uploaded. Open the page to read it.",
      pdfCacheVersion: earlyVersion,
    };
  }

  onProgress?.({
    loaded: toUpload.size,
    total: toUpload.size,
    percent: 100,
    phase: "finalizing",
  });
  const done = await request<{
    page: UserPageSummary;
    message?: string;
    pdfCacheVersion?: string;
  }>("/api/my-content/uploads/complete", {
    method: "POST",
    body: JSON.stringify({ token: init.token }),
  });

  if (done.page?.id && done.pdfCacheVersion && isPdfFile(toUpload)) {
    await seedPdfByteCache(done.page.id, done.pdfCacheVersion, toUpload);
  }

  return done;
}
