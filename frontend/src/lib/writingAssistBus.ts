import type { WritingAssistOpen } from "./writingAssistTypes";

type Listener = (payload: WritingAssistOpen) => void;

let listener: Listener | null = null;

/** Open paraphrase / originality UI from reader chrome without prop drilling. */
export function openWritingAssist(payload: WritingAssistOpen) {
  listener?.(payload);
}

export function subscribeWritingAssist(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}
