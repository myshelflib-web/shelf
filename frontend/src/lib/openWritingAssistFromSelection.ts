/** Helpers to open writing assist from selection chrome. */
import { openWritingAssist } from "@/lib/writingAssistBus";

export function openParaphraseFromSelection(
  text: string,
  opts?: { pageId?: string; onInsert?: (text: string) => void }
) {
  openWritingAssist({
    mode: "paraphrase",
    text: text.trim(),
    pageId: opts?.pageId,
    onInsert: opts?.onInsert,
  });
}

export function openOriginalityFromSelection(
  text: string,
  opts?: { pageId?: string }
) {
  openWritingAssist({
    mode: "originality",
    text: text.trim(),
    pageId: opts?.pageId,
    includeAiHeuristic: true,
  });
}
