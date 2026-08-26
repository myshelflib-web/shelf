export type StudyAiQueuedPrompt = {
  id: string;
  text: string;
  imageBase64?: string;
};

export function makeQueuedPrompt(
  text: string,
  imageBase64?: string
): StudyAiQueuedPrompt {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    imageBase64,
  };
}

export function enqueuePrompt(
  queue: StudyAiQueuedPrompt[],
  text: string,
  imageBase64?: string
): StudyAiQueuedPrompt[] {
  return [...queue, makeQueuedPrompt(text, imageBase64)];
}

export function takeNextPrompt(queue: StudyAiQueuedPrompt[]): {
  next: StudyAiQueuedPrompt | null;
  rest: StudyAiQueuedPrompt[];
} {
  if (queue.length === 0) return { next: null, rest: queue };
  return { next: queue[0], rest: queue.slice(1) };
}
