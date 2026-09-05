import type { UserContentHighlight } from "@/types";
import { createHighlight, deleteHighlight } from "@/lib/offline/highlights";
import type { HighlightWriteInput } from "@/lib/offline/highlights";
import type { HtmlTextPick } from "./htmlPageSelection";

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

export function persistHtmlHighlight(opts: {
  optimistic: UserContentHighlight;
  payload: HighlightWriteInput;
  commit: (next: UserContentHighlight[]) => void;
  current: () => UserContentHighlight[];
  dropped: Set<string>;
}) {
  const { optimistic, payload, commit, current, dropped } = opts;
  commit([...current(), optimistic]);
  void createHighlight(payload)
    .then((highlight) => {
      if (dropped.has(optimistic.id)) {
        dropped.delete(optimistic.id);
        void deleteHighlight(highlight.id, optimistic.userTopicId).catch(
          () => undefined
        );
        return;
      }
      commit(current().map((h) => (h.id === optimistic.id ? highlight : h)));
    })
    .catch(() => {
      commit(current().filter((h) => h.id !== optimistic.id));
    });
}
