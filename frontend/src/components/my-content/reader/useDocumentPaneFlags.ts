import { useCallback } from "react";
import { api } from "@/lib/api";
import { updatePageProgress } from "@/lib/offline/progress";
import { requireOnline } from "@/lib/offline/notice";
import { syncPageInTree } from "@/lib/myContentTree";
import type { UserSubject } from "@/types";
import type { LoadedPage } from "./DocumentPane";

type SignInGate = {
  active: boolean;
  prompt: (feature: string) => void;
};

export function useDocumentPaneFlags({
  pageData,
  setPageData,
  onNotebookPatch,
  signInGate,
}: {
  pageData: LoadedPage | null;
  setPageData: (page: LoadedPage) => void;
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
    const previous = pageData;
    setPageData({ ...pageData, completed });
    if (!pageData.isPreloaded) {
      onNotebookPatch((prev) =>
        prev ? syncPageInTree([prev], pageData.id, { completed })[0] : prev
      );
    }
    try {
      if (pageData.isPreloaded) {
        if (!requireOnline("Mark as complete")) throw new Error("offline");
        await api.progress.update(pageData.id, { completed });
      } else {
        await updatePageProgress(pageData.id, { completed });
      }
    } catch {
      setPageData(previous);
      if (!previous.isPreloaded) {
        onNotebookPatch((prev) =>
          prev
            ? syncPageInTree([prev], previous.id, {
                completed: previous.completed,
              })[0]
            : prev
        );
      }
    }
  }, [pageData, onNotebookPatch, signInGate, setPageData]);

  const handleToggleStar = useCallback(async () => {
    if (signInGate?.active) {
      signInGate.prompt("Star articles");
      return;
    }
    if (!pageData || !requireOnline("Star files")) return;
    const starred = !pageData.starred;
    const previous = pageData;
    setPageData({ ...pageData, starred });
    if (!pageData.isPreloaded) {
      onNotebookPatch((prev) =>
        prev ? syncPageInTree([prev], pageData.id, { starred })[0] : prev
      );
    }
    try {
      const { starred: next } = pageData.isPreloaded
        ? await api.progress.toggleStar(pageData.id)
        : await api.myContent.toggleStar(pageData.id);
      setPageData({ ...pageData, starred: next });
    } catch {
      setPageData(previous);
      if (!previous.isPreloaded) {
        onNotebookPatch((prev) =>
          prev
            ? syncPageInTree([prev], previous.id, {
                starred: previous.starred,
              })[0]
            : prev
        );
      }
    }
  }, [pageData, onNotebookPatch, signInGate, setPageData]);

  return { handleToggleComplete, handleToggleStar };
}
