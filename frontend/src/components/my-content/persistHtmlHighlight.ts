import type { UserContentHighlight } from "@/types";
import { createHighlight, deleteHighlight } from "@/lib/offline/highlights";
import type { HighlightWriteInput } from "@/lib/offline/highlights";

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
