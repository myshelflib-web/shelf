import type { UserContentType } from "@/types";
import type { LoadedPage } from "./documentPaneFetch";
import type { PersonalPageReaderScope } from "./types";

/** Minimal PDF page shell so PdfViewer can mount before full page JSON returns. */
export function optimisticPdfLoadedPage(input: {
  id: string;
  title: string;
  scope: PersonalPageReaderScope;
}): LoadedPage {
  const notebookSlug =
    input.scope.kind === "topic" || input.scope.kind === "notebook-file"
      ? input.scope.notebookSlug
      : null;
  const topicSlug =
    input.scope.kind === "topic" ? input.scope.topicSlug : null;
  return {
    id: input.id,
    title: input.title,
    content: "",
    contentType: "PDF" satisfies UserContentType,
    completed: false,
    starred: false,
    readPercent: 0,
    navigation: { prev: null, next: null },
    notebookSlug,
    topicSlug,
    notebookMeta: null,
    topicMeta: null,
  };
}

export function canOptimisticMountPdf(input: {
  pageId?: string | null;
  contentType?: UserContentType | null;
  scope: PersonalPageReaderScope;
}): boolean {
  if (!input.pageId) return false;
  if (input.contentType !== "PDF") return false;
  if (input.scope.kind === "learn") return false;
  if (input.scope.kind === "shared" && !input.scope.linkToken) return false;
  return true;
}
