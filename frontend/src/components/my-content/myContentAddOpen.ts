import type { UserPageSummary, UserContentType } from "@/types";
import { emitOpenPage } from "@/lib/contentEvents";
import { setOptimisticOpenSeed } from "@/lib/optimisticOpenSeed";
import { isReaderHref } from "@/lib/softNavigate";
import { scopeFromHref } from "@/components/my-content/reader/types";
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

/** Library uploads no longer pack in the browser — start in uploading phase. */
export function initialUploadProgress(file: File): UploadProgress {
  return {
    loaded: 0,
    total: file.size,
    percent: 0,
    phase: "uploading",
  };
}

export type { UserContentType };
