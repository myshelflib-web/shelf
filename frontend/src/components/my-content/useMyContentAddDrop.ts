import { useCallback, useState, type DragEvent } from "react";
import { api } from "@/lib/api";
import { getTopicGroups } from "@/lib/myContentTree";
import type { UserSubject } from "@/types";
import { findCachedSubject } from "@/lib/offline/library";
import type { AddTarget } from "./MyContentAddProvider";
import {
  addContextFromPath,
  isFileDrag,
  isFolderDrop,
  pickDroppedFile,
  pickDroppedFiles,
  titleFromFile,
} from "./myContentAddUtils";

type DropOpts = {
  submitting: boolean;
  targetKind?: AddTarget["kind"];
  openAdd: (target: AddTarget) => void;
  setAddMode: (mode: NonNullable<AddTarget["pageMode"]>) => void;
  setUploadFile: (file: File | null) => void;
  setPageTitle: (value: string | ((prev: string) => string)) => void;
};

export function useMyContentAddDrop({
  submitting,
  targetKind,
  openAdd,
  setAddMode,
  setUploadFile,
  setPageTitle,
}: DropOpts) {
  const [fileDragDepth, setFileDragDepth] = useState(0);

  const openBulkImport = useCallback(
    (files: File[], notebook?: UserSubject) => {
      openAdd({ kind: "page", notebook, pageMode: "bulk", bulkFiles: files });
    },
    [openAdd]
  );

  const openDroppedFile = useCallback(
    (file: File) => {
      const ctx = addContextFromPath(window.location.pathname);
      if (!ctx.notebookSlug) {
        openAdd({ kind: "page", file });
        return;
      }
      const apply = (subject: UserSubject) => {
        const topic = ctx.topicSlug
          ? getTopicGroups(subject).find((g) => g.slug === ctx.topicSlug)
          : undefined;
        openAdd({ kind: "page", notebook: subject, topic, file });
      };
      const cached = findCachedSubject(ctx.notebookSlug);
      if (cached) {
        apply(cached);
        return;
      }
      openAdd({ kind: "page", file });
      void api.myContent
        .getSubject(ctx.notebookSlug)
        .then(({ subject }) => apply(subject))
        .catch(() => {});
    },
    [openAdd]
  );

  const onFileDragEnter = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileDragDepth((d) => d + 1);
  }, []);

  const onFileDragLeave = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileDragDepth((d) => Math.max(0, d - 1));
  }, []);

  const onFileDragOver = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onFileDrop = useCallback(
    (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setFileDragDepth(0);
      if (submitting) return;
      const list = e.dataTransfer.files;
      if (isFolderDrop(list)) {
        const files = pickDroppedFiles(list);
        if (files.length === 0) return;
        const ctx = addContextFromPath(window.location.pathname);
        if (!ctx.notebookSlug) {
          openBulkImport(files);
          return;
        }
        const apply = (subject: UserSubject) => {
          openBulkImport(files, subject);
        };
        const cached = findCachedSubject(ctx.notebookSlug);
        if (cached) {
          apply(cached);
          return;
        }
        openBulkImport(files);
        void api.myContent
          .getSubject(ctx.notebookSlug)
          .then(({ subject }) => apply(subject))
          .catch(() => {});
        return;
      }
      const file = pickDroppedFile(list);
      if (!file) return;
      if (targetKind === "page") {
        setAddMode("file");
        setUploadFile(file);
        setPageTitle((t) => t.trim() || titleFromFile(file));
        return;
      }
      openDroppedFile(file);
    },
    [
      openBulkImport,
      openDroppedFile,
      setAddMode,
      setPageTitle,
      setUploadFile,
      submitting,
      targetKind,
    ]
  );

  return {
    fileDragDepth,
    onFileDragEnter,
    onFileDragLeave,
    onFileDragOver,
    onFileDrop,
  };
}
