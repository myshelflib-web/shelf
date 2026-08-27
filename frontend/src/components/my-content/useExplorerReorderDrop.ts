"use client";

import { useCallback, useState, type DragEvent } from "react";
import {
  parseReorderDrag,
  reorderBefore,
  SHELF_REORDER_MIME,
  type ReorderDragPayload,
} from "@/lib/libraryReorder";

export type ReorderDropHint = {
  kind: "subject" | "topic";
  beforeId: string | null;
  subjectId?: string;
};

export function useExplorerReorderDrop() {
  const [dropHint, setDropHint] = useState<ReorderDropHint | null>(null);

  const startReorderDrag = useCallback(
    (payload: ReorderDragPayload, e: DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.setData(SHELF_REORDER_MIME, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const allowReorderDrop = useCallback((hint: ReorderDropHint, e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDropHint(hint);
  }, []);

  const finishReorderDrop = useCallback(
    async (
      hint: ReorderDropHint,
      e: DragEvent,
      orderedIds: string[],
      apply: (ids: string[]) => void | Promise<void>
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDropHint(null);
      const raw =
        e.dataTransfer.getData(SHELF_REORDER_MIME) ||
        e.dataTransfer.getData("text/plain");
      const drag = parseReorderDrag(raw);
      if (!drag || drag.kind !== hint.kind) return;
      if (hint.kind === "topic" && drag.subjectId !== hint.subjectId) return;
      const next = reorderBefore(orderedIds, drag.id, hint.beforeId);
      if (next.join(",") === orderedIds.join(",")) return;
      await apply(next);
    },
    []
  );

  const clearDropHint = useCallback(() => setDropHint(null), []);

  return {
    dropHint,
    startReorderDrag,
    allowReorderDrop,
    finishReorderDrop,
    clearDropHint,
  };
}
