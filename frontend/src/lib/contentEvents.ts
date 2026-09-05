import { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import {
  buildBulkDeletePayload,
  pageSelectionKey,
} from "@/lib/explorerSelection";
import { pushPendingExplorerDelete } from "@/lib/pendingExplorerDeletes";

export const SHELF_CONTENT_CHANGED = "shelf:content-changed";
export const SHELF_OPEN_PAGE = "shelf:open-page";

export type ContentChange =
  | { type: "notebook-created"; subject: UserSubject }
  | {
      type: "topic-created";
      notebookId: string;
      notebookSlug: string;
      topicGroup: UserTopicGroup;
      /** When set, nest under this folder instead of the collection root. */
      parentTopicId?: string;
      parentTopicSlug?: string;
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
    }
  | {
      type: "page-flags";
      pageId: string;
      completed?: boolean;
      starred?: boolean;
    }
  | {
      type: "page-deleted";
      pageId: string;
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

export function emitPageFlags(
  pageId: string,
  flags: { completed?: boolean; starred?: boolean }
) {
  emitContentChanged({ type: "page-flags", pageId, ...flags });
}

export function emitPageDeleted(pageId: string) {
  pushPendingExplorerDelete(
    buildBulkDeletePayload(new Set([pageSelectionKey(pageId)]))
  );
  emitContentChanged({ type: "page-deleted", pageId });
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
