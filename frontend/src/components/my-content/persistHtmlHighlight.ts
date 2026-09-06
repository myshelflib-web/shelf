import { startTransition } from "react";
import { api } from "@/lib/api";
import type { Highlight, UserContentHighlight } from "@/types";
import { createHighlight, deleteHighlight } from "@/lib/offline/highlights";
import type { HighlightWriteInput } from "@/lib/offline/highlights";
import type { HtmlTextPick } from "./htmlPageSelection";

/** Select → color: TEXT wash (CSS/mark) with rects for hit-testing. */
export function textHighlightDraft(
  userTopicId: string,
  sel: HtmlTextPick,
  color: string,
  note?: string
): UserContentHighlight {
  return {
    id: `tmp-${crypto.randomUUID()}`,
    userTopicId,
    text: sel.text,
    startOffset: sel.startOffset,
    endOffset: sel.endOffset,
    color,
    note: note ?? null,
    kind: "TEXT",
    position: {
      rects: sel.position.rects,
    },
  };
}

export function strokeHighlightDraft(
  userTopicId: string,
  color: string,
  points: Array<{ x: number; y: number }>,
  width: number,
  opacity: number
): UserContentHighlight {
  return {
    id: `tmp-${crypto.randomUUID()}`,
    userTopicId,
    text: "Highlighted region",
    startOffset: 0,
    endOffset: 0,
    color,
    kind: "REGION",
    position: {
      type: "pen",
      tool: "highlight",
      points,
      width,
      opacity,
    },
  };
}

export function curriculumHighlightToUser(
  articleId: string,
  h: Highlight
): UserContentHighlight {
  return {
    id: h.id,
    userTopicId: articleId,
    text: h.text,
    startOffset: h.startOffset,
    endOffset: h.endOffset,
    color: h.color || "yellow",
    note: h.note ?? null,
    kind: "TEXT",
  };
}

/** Keep optimistic geometry if the API omits position fields. */
function mergeSavedHighlight(
  optimistic: UserContentHighlight,
  saved: UserContentHighlight
): UserContentHighlight {
  return {
    ...saved,
    text: saved.text || optimistic.text,
    startOffset:
      saved.endOffset > saved.startOffset
        ? saved.startOffset
        : optimistic.startOffset,
    endOffset:
      saved.endOffset > saved.startOffset
        ? saved.endOffset
        : optimistic.endOffset,
    position: saved.position ?? optimistic.position,
    note: saved.note ?? optimistic.note,
    color: saved.color || optimistic.color,
    kind: saved.kind ?? optimistic.kind,
  };
}

/**
 * Paint immediately; persist in the background.
 * Server id swap is deferred so it never cancels an in-progress selection.
 */
export function persistHtmlHighlight(opts: {
  optimistic: UserContentHighlight;
  payload: HighlightWriteInput;
  commit: (next: UserContentHighlight[]) => void;
  current: () => UserContentHighlight[];
  dropped: Set<string>;
  /** Learn article id — uses curriculum highlight API instead of library. */
  curriculumArticleId?: string;
}) {
  const { optimistic, payload, commit, current, dropped, curriculumArticleId } =
    opts;
  commit([...current(), optimistic]);

  const persist = curriculumArticleId
    ? api.highlights
        .create({
          articleId: curriculumArticleId,
          text: payload.text,
          startOffset: payload.startOffset ?? 0,
          endOffset: payload.endOffset ?? 0,
          color: payload.color,
          note: payload.note,
        })
        .then(({ highlight }) =>
          curriculumHighlightToUser(curriculumArticleId, highlight)
        )
    : createHighlight(payload);

  void persist
    .then((highlight) => {
      if (dropped.has(optimistic.id)) {
        dropped.delete(optimistic.id);
        if (curriculumArticleId) {
          void api.highlights.delete(highlight.id).catch(() => undefined);
        } else {
          void deleteHighlight(highlight.id, optimistic.userTopicId).catch(
            () => undefined
          );
        }
        return;
      }
      const merged = mergeSavedHighlight(optimistic, highlight);
      startTransition(() => {
        commit(current().map((h) => (h.id === optimistic.id ? merged : h)));
      });
    })
    .catch(() => {
      startTransition(() => {
        commit(current().filter((h) => h.id !== optimistic.id));
      });
    });
}

export function removePersistedHtmlHighlight(
  id: string,
  userTopicId: string,
  curriculumArticleId?: string
) {
  if (curriculumArticleId) {
    return api.highlights.delete(id);
  }
  return deleteHighlight(id, userTopicId);
}
