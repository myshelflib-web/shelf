import type { UserPageSummary, UserContentType } from "@/types";
import { emitOpenPage } from "@/lib/contentEvents";
import { setOptimisticOpenSeed } from "@/lib/optimisticOpenSeed";
import { isReaderHref } from "@/lib/softNavigate";
import { scopeFromHref } from "@/components/my-content/reader/types";
import { shouldCompressUpload } from "@/lib/compressUploadFile";
import { decidePdfCompress } from "@/lib/pdfCompressDecision";
import type { UploadProgress } from "@/lib/api";
import type { AddPageOpenSeed } from "./myContentAddPageSubmit";

type RouterLike = { push: (href: string) => void };

export function openCreatedLibraryPage(
  router: RouterLike,
  href: string,
  page: UserPageSummary,
  openSeed?: AddPageOpenSeed
): void {
  const contentType = openSeed?.contentType ?? page.contentType;
  if (contentType) {
    setOptimisticOpenSeed({
      pageId: page.id,
      href,
      contentType,
      title: openSeed?.title ?? page.title,
      content: openSeed?.content,
      sourceUrl: openSeed?.sourceUrl,
    });
  }
  const scope = scopeFromHref(href);
  if (scope && isReaderHref(window.location.pathname)) {
    emitOpenPage({
      href,
      title: page.title,
      pageId: page.id,
      scope,
      contentType,
    });
    return;
  }
  router.push(href);
}

export function initialUploadProgress(file: File): UploadProgress {
  const name = file.name.toLowerCase();
  const isPdf =
    name.endsWith(".pdf") ||
    (file.type || "").toLowerCase() === "application/pdf";
  const phase = isPdf
    ? decidePdfCompress(file).attempt
      ? "compressing"
      : "uploading"
    : shouldCompressUpload(file)
      ? "compressing"
      : "uploading";
  return {
    loaded: 0,
    total: file.size,
    percent: 0,
    phase,
  };
}

export type { UserContentType };
