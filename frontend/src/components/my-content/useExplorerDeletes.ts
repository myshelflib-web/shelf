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
import { pushPendingExplorerDelete } from "@/lib/pendingExplorerDeletes";
import { emitContentChanged, emitPageDeleted } from "@/lib/contentEvents";
import { patchLibraryCacheAfterDelete } from "@/lib/offline/library";
import {
  runDeleteWithProgressUi,
  useDeleteProgress,
} from "@/components/DeleteProgressProvider";
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

function selectionKeysForPayload(
  payload: ReturnType<typeof buildBulkDeletePayload>
): string[] {
  return [
    ...payload.subjectIds.map((id) => `subject:${id}`),
    ...payload.topicGroups.map((g) => `topic:${g.subjectId}:${g.groupId}`),
    ...payload.pageIds.map((id) => pageSelectionKey(id)),
  ];
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
  const progress = useDeleteProgress();

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
      const keys = selectionKeysForPayload(payload);
      try {
        await runDeleteWithProgressUi(
          progress,
          `Deleting folder "${title}"…`,
          () => api.myContent.deleteTopicGroup(nb.id, groupId),
          keys
        );
        pushPendingExplorerDelete(payload);
        applyDeleteLocally(
          payload,
          setSubjects,
          setPinnedExtra,
          setRootPages
        );
        void patchLibraryCacheAfterDelete(payload);
      } catch {
        await alert({
          title: "Delete failed",
          message: `Could not delete folder "${title}". Refresh the library and try again.`,
        });
      }
    },
    [alert, confirm, progress, setPinnedExtra, setRootPages, setSubjects]
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
      const keys = selectionKeysForPayload(payload);
      try {
        await runDeleteWithProgressUi(
          progress,
          `Deleting "${title}"…`,
          () => api.myContent.deletePage(pageId),
          keys
        );
        void removeCachedPdf(pageId);
        emitPageDeleted(pageId);
        applyDeleteLocally(
          payload,
          setSubjects,
          setPinnedExtra,
          setRootPages
        );
        void patchLibraryCacheAfterDelete(payload);
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
      progress,
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
      count === 1 ? "Deleting 1 item…" : `Deleting ${count} items…`;
    const keys = selectionKeysForPayload(payload);
    exitSelectionMode();

    void (async () => {
      try {
        await runDeleteWithProgressUi(
          progress,
          label,
          () => api.myContent.bulkDelete(payload),
          keys
        );
        pushPendingExplorerDelete(payload);
        applyDeleteLocally(
          payload,
          setSubjects,
          setPinnedExtra,
          setRootPages
        );
        void patchLibraryCacheAfterDelete(payload);
        for (const pageId of payload.pageIds) {
          void removeCachedPdf(pageId);
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
    progress,
    selected,
    setPinnedExtra,
    setRootPages,
    setSubjects,
  ]);

  return { deleteTopic, deletePage, handleBulkDelete };
}
