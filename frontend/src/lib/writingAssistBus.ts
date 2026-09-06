import type { WritingAssistOpen } from "./writingAssistTypes";

type Listener = (payload: WritingAssistOpen) => void;

const listeners = new Set<Listener>();

/** Open paraphrase / originality UI from reader chrome without prop drilling. */
export function openWritingAssist(payload: WritingAssistOpen) {
  if (listeners.size === 0) {
    console.warn(
      "[writingAssist] No host mounted — open WritingAssistHost in the page shell."
    );
    return;
  }
  for (const listener of listeners) listener(payload);
}

export function subscribeWritingAssist(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
