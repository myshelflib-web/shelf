import { useCallback, type Dispatch, type SetStateAction } from "react";
import { api } from "@/lib/api";
import { updatePageProgress } from "@/lib/offline/progress";
import { notifyActionError, requireOnline } from "@/lib/offline/notice";
import { syncPageInTree } from "@/lib/myContentTree";
import { emitPageFlags } from "@/lib/contentEvents";
import { patchLibraryCachePageFlags } from "@/lib/offline/library";
import { toUserFacingError } from "@/lib/userFacingError";
import type { UserSubject } from "@/types";
import type { LoadedPage } from "./DocumentPane";

type SignInGate = {
  active: boolean;
  prompt: (feature: string) => void;
};

function applyFlagsLocally(
  pageId: string,
  flags: { completed?: boolean; starred?: boolean },
  setPageData: Dispatch<SetStateAction<LoadedPage | null>>,
  onNotebookPatch: (
    updater: (prev: UserSubject | null) => UserSubject | null
  ) => void,
  isPreloaded: boolean
) {
  setPageData((prev) => (prev ? { ...prev, ...flags } : prev));
  if (!isPreloaded) {
    onNotebookPatch((prev) =>
      prev ? syncPageInTree([prev], pageId, flags)[0] : prev
    );
    emitPageFlags(pageId, flags);
    patchLibraryCachePageFlags(pageId, flags);
  }
}

export function useDocumentPaneFlags({
  pageData,
  setPageData,
  onNotebookPatch,
  signInGate,
}: {
  pageData: LoadedPage | null;
  setPageData: Dispatch<SetStateAction<LoadedPage | null>>;
  onNotebookPatch: (
    updater: (prev: UserSubject | null) => UserSubject | null
  ) => void;
  signInGate?: SignInGate;
}) {
  const handleToggleComplete = useCallback(async () => {
    if (signInGate?.active) {
      signInGate.prompt("Mark as complete");
      return;
    }
    if (!pageData) return;
    const completed = !pageData.completed;
    const previous = pageData.completed;
    const pageId = pageData.id;
    const isPreloaded = Boolean(pageData.isPreloaded);

    applyFlagsLocally(
      pageId,
      { completed },
      setPageData,
      onNotebookPatch,
      isPreloaded
    );

    try {
      if (isPreloaded) {
        if (!requireOnline("Mark as complete")) throw new Error("offline");
        await api.progress.update(pageId, { completed });
      } else {
        await updatePageProgress(pageId, { completed });
      }
    } catch (err) {
      applyFlagsLocally(
        pageId,
        { completed: previous },
        setPageData,
        onNotebookPatch,
        isPreloaded
      );
      if (err instanceof Error && err.message === "offline") return;
      notifyActionError(
        toUserFacingError(
          err instanceof Error ? err.message : "",
          "Couldn't update mark done. Try again."
        )
      );
    }
  }, [pageData, onNotebookPatch, signInGate, setPageData]);

  const handleToggleStar = useCallback(async () => {
    if (signInGate?.active) {
      signInGate.prompt("Star articles");
      return;
    }
    if (!pageData || !requireOnline("Star files")) return;
    const starred = !pageData.starred;
    const previous = pageData.starred;
    const pageId = pageData.id;
    const isPreloaded = Boolean(pageData.isPreloaded);

    applyFlagsLocally(
      pageId,
      { starred },
      setPageData,
      onNotebookPatch,
      isPreloaded
    );

    try {
      const { starred: next } = isPreloaded
        ? await api.progress.toggleStar(pageId)
        : await api.myContent.toggleStar(pageId);
      if (next !== starred) {
        applyFlagsLocally(
          pageId,
          { starred: next },
          setPageData,
          onNotebookPatch,
          isPreloaded
        );
      }
    } catch (err) {
      applyFlagsLocally(
        pageId,
        { starred: previous },
        setPageData,
        onNotebookPatch,
        isPreloaded
      );
      notifyActionError(
        toUserFacingError(
          err instanceof Error ? err.message : "",
          "Couldn't update star. Try again."
        )
      );
    }
  }, [pageData, onNotebookPatch, signInGate, setPageData]);

  return { handleToggleComplete, handleToggleStar };
}
