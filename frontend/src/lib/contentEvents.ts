import { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";

export const SHELF_CONTENT_CHANGED = "shelf:content-changed";
export const SHELF_OPEN_PAGE = "shelf:open-page";

export type ContentChange =
  | { type: "notebook-created"; subject: UserSubject }
  | {
      type: "topic-created";
      notebookId: string;
      notebookSlug: string;
      topicGroup: UserTopicGroup;
    }
  | {
      type: "page-created";
      page: UserPageSummary;
      href: string;
      notebookId?: string;
      notebookSlug?: string | null;
      topicId?: string;
      topicSlug?: string | null;
    }
  | {
      type: "page-renamed";
      pageId: string;
      title: string;
    };

export type OpenPageDetail = {
  href: string;
  title: string;
  pageId: string;
  scope: PersonalPageReaderScope;
};

export function emitContentChanged(detail?: ContentChange) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ContentChange | undefined>(SHELF_CONTENT_CHANGED, { detail })
  );
}

export function emitPageRenamed(pageId: string, title: string) {
  emitContentChanged({ type: "page-renamed", pageId, title });
}

export function emitOpenPage(detail: OpenPageDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<OpenPageDetail>(SHELF_OPEN_PAGE, { detail })
  );
}

export function contentChangeFromEvent(e: Event): ContentChange | undefined {
  if (!("detail" in e)) return undefined;
  const detail = (e as CustomEvent<ContentChange | undefined>).detail;
  if (!detail || typeof detail !== "object" || !("type" in detail)) {
    return undefined;
  }
  return detail;
}
