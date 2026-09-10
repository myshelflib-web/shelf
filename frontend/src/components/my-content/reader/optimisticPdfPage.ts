import type { UserContentType } from "@/types";
import type { OptimisticOpenSeed } from "@/lib/optimisticOpenSeed";
import type { LoadedPage } from "./documentPaneFetch";
import type { PersonalPageReaderScope } from "./types";

function scopeSlugs(scope: PersonalPageReaderScope): {
  notebookSlug: string | null;
  topicSlug: string | null;
} {
  const notebookSlug =
    scope.kind === "topic" || scope.kind === "notebook-file"
      ? scope.notebookSlug
      : null;
  const topicSlug = scope.kind === "topic" ? scope.topicSlug : null;
  return { notebookSlug, topicSlug };
}

export function optimisticLoadedPage(input: {
  id: string;
  title: string;
  scope: PersonalPageReaderScope;
  contentType: UserContentType;
  content?: string;
  sourceUrl?: string | null;
}): LoadedPage {
  const { notebookSlug, topicSlug } = scopeSlugs(input.scope);
  return {
    id: input.id,
    title: input.title,
    content: input.content ?? "",
    contentType: input.contentType,
    sourceUrl: input.sourceUrl ?? null,
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

/** @deprecated use optimisticLoadedPage — kept for existing PDF call sites/tests. */
export function optimisticPdfLoadedPage(input: {
  id: string;
  title: string;
  scope: PersonalPageReaderScope;
}): LoadedPage {
  return optimisticLoadedPage({ ...input, contentType: "PDF" });
}

export function canOptimisticMount(input: {
  pageId?: string | null;
  contentType?: UserContentType | null;
  scope: PersonalPageReaderScope;
  seed?: OptimisticOpenSeed | null;
}): boolean {
  const pageId = input.pageId ?? input.seed?.pageId;
  const contentType = input.contentType ?? input.seed?.contentType;
  if (!pageId || !contentType) return false;
  if (input.scope.kind === "learn") return false;
  if (input.scope.kind === "shared" && !input.scope.linkToken) return false;

  switch (contentType) {
    case "PDF":
      return true;
    case "LINK":
    case "VIDEO":
      return Boolean(input.seed?.sourceUrl);
    case "HTML":
      // Doc/sketch need the client HTML so the live editor is not empty.
      return Boolean(input.seed?.content);
    default:
      // TEXT/MARKDOWN/DOCX: content only exists after server convert — no early shell.
      return false;
  }
}

/** @deprecated use canOptimisticMount */
export function canOptimisticMountPdf(input: {
  pageId?: string | null;
  contentType?: UserContentType | null;
  scope: PersonalPageReaderScope;
}): boolean {
  return canOptimisticMount({ ...input, seed: null });
}
