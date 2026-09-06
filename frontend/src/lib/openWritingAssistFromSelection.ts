/** Helpers to open writing assist from selection chrome. */
import { openWritingAssist } from "@/lib/writingAssistBus";

export function openParaphraseFromSelection(
  text: string,
  opts?: { pageId?: string; onInsert?: (text: string) => void }
) {
  const t = text.trim();
  if (t.length < 12) return;
  openWritingAssist({
    mode: "paraphrase",
    text: t,
    pageId: opts?.pageId,
    onInsert: opts?.onInsert,
  });
}

export function openOriginalityFromSelection(
  text: string,
  opts?: { pageId?: string }
) {
  const t = text.trim();
  if (t.length < 24) return;
  openWritingAssist({
    mode: "originality",
    text: t,
    pageId: opts?.pageId,
    includeAiHeuristic: true,
  });
}
