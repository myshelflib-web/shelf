import type { Dispatch, SetStateAction } from "react";
import type { UserPageSummary, UserSubject } from "@/types";
import type { ContentChange } from "@/lib/contentEvents";
import {
  insertPageInTree,
  insertTopicInTree,
  syncPageInTree,
  syncRootPages,
} from "@/lib/myContentTree";
import {
  buildBulkDeletePayload,
  pageSelectionKey,
} from "@/lib/explorerSelection";
import { applyBulkDeleteToTree } from "@/lib/explorerBulkDeleteTree";

type Setter<T> = Dispatch<SetStateAction<T>>;

export type ExplorerContentSyncCtx = {
  setSubjects: Setter<UserSubject[]>;
  setPinnedExtra: Setter<UserSubject[]>;
  setRootPages: Setter<UserPageSummary[]>;
  setExpandedNotebooks: Setter<Record<string, boolean>>;
  setExpandedTopics: Setter<Record<string, boolean>>;
  setTotalNotebooks: Setter<number>;
  reloadSilent: () => void;
};

function pageFlagsPatch(
  change: Extract<ContentChange, { type: "page-flags" }>
): Partial<UserPageSummary> {
  const patch: Partial<UserPageSummary> = {};
  if (change.completed !== undefined) patch.completed = change.completed;
  if (change.starred !== undefined) patch.starred = change.starred;
  return patch;
}

/** Apply a library explorer content event. Returns true when handled. */
export function applyExplorerContentChange(
  change: ContentChange | undefined,
  ctx: ExplorerContentSyncCtx
): boolean {
  if (!change) {
    ctx.reloadSilent();
    return true;
  }

  if (change.type === "notebook-created") {
    ctx.setSubjects((prev) =>
      prev.some((s) => s.id === change.subject.id)
        ? prev
        : [change.subject, ...prev]
    );
    ctx.setTotalNotebooks((n) => n + 1);
    ctx.setExpandedNotebooks((prev) => ({
      ...prev,
      [change.subject.slug]: true,
    }));
    return true;
  }

  if (change.type === "topic-created") {
    const insert = (prev: UserSubject[]) =>
      insertTopicInTree(
        prev,
        change.notebookId,
        change.topicGroup,
        change.parentTopicId
      );
    ctx.setSubjects(insert);
    ctx.setPinnedExtra(insert);
    ctx.setExpandedNotebooks((prev) => ({
      ...prev,
      [change.notebookSlug]: true,
    }));
    if (change.parentTopicSlug) {
      const tKey = `${change.notebookSlug}:${change.parentTopicSlug}`;
      ctx.setExpandedTopics((prev) => ({ ...prev, [tKey]: true }));
    }
    return true;
  }

  if (change.type === "page-created") {
    if (change.notebookId) {
      const insert = (prev: UserSubject[]) =>
        insertPageInTree(
          prev,
          change.page,
          change.notebookId!,
          change.topicId
        );
      ctx.setSubjects(insert);
      ctx.setPinnedExtra(insert);
    } else {
      ctx.setRootPages((prev) =>
        prev.some((p) => p.id === change.page.id)
          ? prev
          : [change.page, ...prev]
      );
    }
    if (change.notebookSlug) {
      ctx.setExpandedNotebooks((prev) => ({
        ...prev,
        [change.notebookSlug as string]: true,
      }));
    }
    if (change.notebookSlug && change.topicSlug) {
      ctx.setExpandedTopics((prev) => ({
        ...prev,
        [`${change.notebookSlug}:${change.topicSlug}`]: true,
      }));
    }
    return true;
  }

  if (change.type === "page-renamed") {
    const patch = { title: change.title };
    ctx.setRootPages((prev) => syncRootPages(prev, change.pageId, patch));
    ctx.setSubjects((prev) => syncPageInTree(prev, change.pageId, patch));
    ctx.setPinnedExtra((prev) => syncPageInTree(prev, change.pageId, patch));
    return true;
  }

  if (change.type === "page-flags") {
    const patch = pageFlagsPatch(change);
    ctx.setRootPages((prev) => syncRootPages(prev, change.pageId, patch));
    ctx.setSubjects((prev) => syncPageInTree(prev, change.pageId, patch));
    ctx.setPinnedExtra((prev) => syncPageInTree(prev, change.pageId, patch));
    return true;
  }

  if (change.type === "page-deleted") {
    const payload = buildBulkDeletePayload(
      new Set([pageSelectionKey(change.pageId)])
    );
    ctx.setSubjects((s) => applyBulkDeleteToTree(payload, s, []).subjects);
    ctx.setPinnedExtra((p) => applyBulkDeleteToTree(payload, p, []).subjects);
    ctx.setRootPages((r) => applyBulkDeleteToTree(payload, [], r).rootPages);
    return true;
  }

  ctx.reloadSilent();
  return true;
}
