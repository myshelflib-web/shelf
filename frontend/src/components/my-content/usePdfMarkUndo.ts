"use client";

import { useCallback, useRef, useState } from "react";
import {
  createHighlight,
  deleteHighlight,
} from "@/lib/offline/highlights";
import type { UserContentHighlight } from "@/types";

const MAX_UNDO = 40;

type UndoEntry =
  | { type: "add"; id: string }
  | { type: "remove"; highlights: UserContentHighlight[] };

/**
 * Local undo stack for PDF marks (highlighter, ink, text highlights, erases).
 * Keeps the PdfViewer surface thin — call push* around mutations, then undo().
 */
export function usePdfMarkUndo(
  userTopicId: string,
  getHighlights: () => UserContentHighlight[],
  setHighlights: (next: UserContentHighlight[]) => void
) {
  const stackRef = useRef<UndoEntry[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const syncCanUndo = useCallback(() => {
    setCanUndo(stackRef.current.length > 0);
  }, []);

  const push = useCallback(
    (entry: UndoEntry) => {
      stackRef.current = [...stackRef.current, entry].slice(-MAX_UNDO);
      syncCanUndo();
    },
    [syncCanUndo]
  );

  const pushAdd = useCallback(
    (id: string) => {
      push({ type: "add", id });
    },
    [push]
  );

  const pushRemove = useCallback(
    (highlights: UserContentHighlight[]) => {
      if (!highlights.length) return;
      push({
        type: "remove",
        highlights: highlights.map((h) => ({ ...h })),
      });
    },
    [push]
  );

  /** When an optimistic tmp-id is replaced by the server id. */
  const remapId = useCallback((fromId: string, toId: string) => {
    stackRef.current = stackRef.current.map((entry) =>
      entry.type === "add" && entry.id === fromId
        ? { type: "add", id: toId }
        : entry
    );
  }, []);

  const clear = useCallback(() => {
    stackRef.current = [];
    syncCanUndo();
  }, [syncCanUndo]);

  const undo = useCallback(async () => {
    const entry = stackRef.current.pop();
    syncCanUndo();
    if (!entry) return;

    if (entry.type === "add") {
      setHighlights(getHighlights().filter((h) => h.id !== entry.id));
      if (!entry.id.startsWith("tmp-")) {
        await deleteHighlight(entry.id, userTopicId).catch(() => undefined);
      }
      return;
    }

    const restored: UserContentHighlight[] = [];
    for (const h of entry.highlights) {
      if (h.id.startsWith("tmp-")) {
        restored.push(h);
        continue;
      }
      try {
        const created = await createHighlight({
          userTopicId,
          text: h.text,
          color: h.color,
          note: h.note ?? undefined,
          kind: h.kind,
          pageNumber: h.pageNumber ?? undefined,
          position: h.position ?? undefined,
        });
        restored.push(created);
      } catch {
        restored.push(h);
      }
    }
    const current = getHighlights();
    const existing = new Set(current.map((h) => h.id));
    setHighlights([
      ...current,
      ...restored.filter((h) => !existing.has(h.id)),
    ]);
  }, [getHighlights, setHighlights, syncCanUndo, userTopicId]);

  return { canUndo, pushAdd, pushRemove, remapId, clear, undo };
}
