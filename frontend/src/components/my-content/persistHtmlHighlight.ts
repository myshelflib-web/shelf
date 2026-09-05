import type { UserContentHighlight } from "@/types";
import { createHighlight, deleteHighlight } from "@/lib/offline/highlights";
import type { HighlightWriteInput } from "@/lib/offline/highlights";
import { PEN_WIDTHS } from "@/lib/straightenStroke";
import type { HtmlTextPick } from "./htmlPageSelection";

const TEXT_HIGHLIGHT_WIDTH =
  PEN_WIDTHS.find((s) => s.id === "xs")?.width ?? 0.0016;

/** Select → color: same XS horizontal marker the PDF highlighter uses. */
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
      type: "pen",
      tool: "highlight",
      rects: sel.position.rects,
      width: TEXT_HIGHLIGHT_WIDTH,
      opacity: 0.72,
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
