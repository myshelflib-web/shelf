"use client";

import { useCallback, useState, type DragEvent } from "react";
import {
  parseReorderDrag,
  SHELF_REORDER_MIME,
  type ReorderDragPayload,
} from "@/lib/libraryReorder";

export type ExplorerDropHint =
  | { kind: "subject"; beforeId: string | null }
  | { kind: "topic"; subjectId: string; beforeId: string | null }
  | { kind: "subject-row"; subjectId: string }
  | { kind: "topic-row"; subjectId: string; topicGroupId: string }
  | { kind: "page-root"; beforePageId: string | null }
  | { kind: "page-notebook"; subjectId: string; beforePageId: string | null }
  | {
      kind: "page-topic";
      subjectId: string;
      topicGroupId: string;
      beforePageId: string | null;
    };

export type ExplorerDropHandlers = {
  onReorderSubjects: (orderedIds: string[]) => void | Promise<void>;
  onReorderTopics: (
    subjectId: string,
    orderedIds: string[]
  ) => void | Promise<void>;
  onMovePage: (payload: {
    pageId: string;
    subjectId: string | null;
    topicGroupId: string | null;
    beforePageId: string | null;
  }) => void | Promise<void>;
  onMoveTopic: (payload: {
    groupId: string;
    sourceSubjectId: string;
    targetSubjectId: string;
    beforeGroupId: string | null;
  }) => void | Promise<void>;
};

function readDrag(e: DragEvent): ReorderDragPayload | null {
  const raw =
    e.dataTransfer.getData(SHELF_REORDER_MIME) ||
    e.dataTransfer.getData("text/plain");
  return parseReorderDrag(raw);
}

export function useExplorerLibraryDrag(handlers: ExplorerDropHandlers) {
  const [dropHint, setDropHint] = useState<ExplorerDropHint | null>(null);
  const [activeDrag, setActiveDrag] = useState<ReorderDragPayload | null>(null);

  const startReorderDrag = useCallback(
    (payload: ReorderDragPayload, e: DragEvent) => {
      e.stopPropagation();
      setActiveDrag(payload);
      e.dataTransfer.setData(SHELF_REORDER_MIME, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const allowReorderDrop = useCallback((hint: ExplorerDropHint, e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropHint(hint);
  }, []);

  const finishReorderDrop = useCallback(
    async (
      hint: ExplorerDropHint,
      e: DragEvent,
      context: {
        subjectIds?: string[];
        topicIds?: string[];
        pageIds?: string[];
      }
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDropHint(null);
      const drag = readDrag(e);
      if (!drag) return;

      if (hint.kind === "topic" && drag.kind === "topic") {
        if (drag.subjectId === hint.subjectId) return;
        await handlers.onMoveTopic({
          groupId: drag.id,
          sourceSubjectId: drag.subjectId!,
          targetSubjectId: hint.subjectId,
          beforeGroupId: hint.beforeId,
        });
        return;
      }

      if (hint.kind === "subject-row" && drag.kind === "page") {
        await handlers.onMovePage({
          pageId: drag.id,
          subjectId: hint.subjectId,
          topicGroupId: null,
          beforePageId: null,
        });
        return;
      }

      if (hint.kind === "subject-row" && drag.kind === "topic") {
        if (drag.subjectId === hint.subjectId) return;
        await handlers.onMoveTopic({
          groupId: drag.id,
          sourceSubjectId: drag.subjectId!,
          targetSubjectId: hint.subjectId,
          beforeGroupId: null,
        });
        return;
      }

      if (hint.kind === "topic-row" && drag.kind === "page") {
        await handlers.onMovePage({
          pageId: drag.id,
          subjectId: hint.subjectId,
          topicGroupId: hint.topicGroupId,
          beforePageId: null,
        });
        return;
      }

      if (drag.kind === "page") {
        if (hint.kind === "page-root") {
          await handlers.onMovePage({
            pageId: drag.id,
            subjectId: null,
            topicGroupId: null,
            beforePageId: hint.beforePageId,
          });
          return;
        }
        if (hint.kind === "page-notebook") {
          await handlers.onMovePage({
            pageId: drag.id,
            subjectId: hint.subjectId,
            topicGroupId: null,
            beforePageId: hint.beforePageId,
          });
          return;
        }
        if (hint.kind === "page-topic") {
          await handlers.onMovePage({
            pageId: drag.id,
            subjectId: hint.subjectId,
            topicGroupId: hint.topicGroupId,
            beforePageId: hint.beforePageId,
          });
        }
      }
    },
    [handlers]
  );

  const clearDropHint = useCallback(() => {
    setDropHint(null);
    setActiveDrag(null);
  }, []);

  return {
    dropHint,
    activeDrag,
    startReorderDrag,
    allowReorderDrop,
    finishReorderDrop,
    clearDropHint,
  };
}

export type ReorderDropHint = ExplorerDropHint;
