"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { UserPageSummary, UserSubject } from "@/types";
import { api } from "@/lib/api";
import { removeCachedPdf } from "@/lib/pdfByteCache";
import { applyBulkDeleteToTree } from "@/lib/explorerBulkDeleteTree";
import {
  buildBulkDeletePayload,
  pageSelectionKey,
  topicSelectionKey,
  type ExplorerSelectionKey,
} from "@/lib/explorerSelection";
import {
  pushPendingExplorerDelete,
} from "@/lib/pendingExplorerDeletes";
import { emitContentChanged, emitPageDeleted } from "@/lib/contentEvents";
import { runDeleteWithProgress } from "@/lib/deleteProgress";
import { useAppDialog } from "@/hooks/useAppDialog";

type UseExplorerDeletesArgs = {
  setSubjects: Dispatch<SetStateAction<UserSubject[]>>;
  setPinnedExtra: Dispatch<SetStateAction<UserSubject[]>>;
  setRootPages: Dispatch<SetStateAction<UserPageSummary[]>>;
  workspaceMode: boolean;
  navigateHome: () => void;
  selected: Set<ExplorerSelectionKey>;
  exitSelectionMode: () => void;
};

function applyDeleteLocally(
  payload: ReturnType<typeof buildBulkDeletePayload>,
  setSubjects: Dispatch<SetStateAction<UserSubject[]>>,
  setPinnedExtra: Dispatch<SetStateAction<UserSubject[]>>,
  setRootPages: Dispatch<SetStateAction<UserPageSummary[]>>
) {
  setSubjects((s) => applyBulkDeleteToTree(payload, s, []).subjects);
  setPinnedExtra((p) => applyBulkDeleteToTree(payload, p, []).subjects);
  setRootPages((r) => applyBulkDeleteToTree(payload, [], r).rootPages);
}

/** Library explorer deletes: progress UI, remove from tree only after API success. */
export function useExplorerDeletes({
  setSubjects,
  setPinnedExtra,
  setRootPages,
  workspaceMode,
  navigateHome,
  selected,
  exitSelectionMode,
}: UseExplorerDeletesArgs) {
  const { confirm, alert } = useAppDialog();

  const deleteTopic = useCallback(
    async (nb: UserSubject, groupId: string, title: string) => {
      const ok = await confirm({
        title: "Delete folder",
        message: `Delete folder "${title}" and its files? This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;
      const payload = buildBulkDeletePayload(
        new Set([topicSelectionKey(nb.id, groupId)])
      );
      try {
        await runDeleteWithProgress(`Deleting folder "${title}"…`, () =>
          api.myContent.deleteTopicGroup(nb.id, groupId)
        );
        pushPendingExplorerDelete(payload);
        applyDeleteLocally(
          payload,
          setSubjects,
          setPinnedExtra,
          setRootPages
        );
      } catch {
        await alert({
          title: "Delete failed",
          message: `Could not delete folder "${title}". Refresh the library and try again.`,
        });
      }
    },
    [alert, confirm, setPinnedExtra, setRootPages, setSubjects]
  );

  const deletePage = useCallback(
    async (pageId: string, title: string) => {
      const ok = await confirm({
        title: "Delete file",
        message: `Delete file "${title}"? This cannot be undone.`,
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;
      const payload = buildBulkDeletePayload(
        new Set([pageSelectionKey(pageId)])
      );
      try {
        await runDeleteWithProgress(`Deleting "${title}"…`, () =>
          api.myContent.deletePage(pageId)
        );
        void removeCachedPdf(pageId);
        emitPageDeleted(pageId);
        applyDeleteLocally(
          payload,
          setSubjects,
          setPinnedExtra,
          setRootPages
        );
        if (!workspaceMode) navigateHome();
      } catch {
        await alert({
          title: "Delete failed",
          message: `Could not delete "${title}". Refresh the library and try again.`,
        });
      }
    },
    [
      alert,
      confirm,
      navigateHome,
      setPinnedExtra,
      setRootPages,
      setSubjects,
      workspaceMode,
    ]
  );

  const handleBulkDelete = useCallback(() => {
    const payload = buildBulkDeletePayload(selected);
    const count =
      payload.subjectIds.length +
      payload.topicGroups.length +
      payload.pageIds.length;
    const label =
      count === 1
        ? "Deleting 1 item…"
        : `Deleting ${count} items…`;
    exitSelectionMode();

    void (async () => {
      try {
        await runDeleteWithProgress(label, () =>
          api.myContent.bulkDelete(payload)
        );
        pushPendingExplorerDelete(payload);
        applyDeleteLocally(
          payload,
          setSubjects,
          setPinnedExtra,
          setRootPages
        );
        for (const pageId of payload.pageIds) {
          void removeCachedPdf(pageId);
          // Close open reader tabs; pending already covers refetch races.
          emitContentChanged({ type: "page-deleted", pageId });
        }
      } catch {
        await alert({
          title: "Delete failed",
          message:
            "Could not delete the selected items. Refresh the library and try again.",
        });
      }
    })();
  }, [
    alert,
    exitSelectionMode,
    selected,
    setPinnedExtra,
    setRootPages,
    setSubjects,
  ]);

  return { deleteTopic, deletePage, handleBulkDelete };
}
