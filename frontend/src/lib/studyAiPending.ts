export const STUDY_AI_PENDING_KEY = "shelf:study-ai-pending";
/** Sentinel for a prompt that should start a brand-new chat. */
export const STUDY_AI_NEW_THREAD = "new";
const KEY = STUDY_AI_PENDING_KEY;

type Pending = {
  threadId: string;
  text: string;
  imageBase64?: string;
};

export function stashStudyAiPending(
  threadId: string,
  text: string,
  imageBase64?: string
) {
  if (typeof sessionStorage === "undefined") return;
  const payload: Pending = { threadId, text, imageBase64 };
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

function readPending(): Pending | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Pending;
  } catch {
    sessionStorage.removeItem(KEY);
    return null;
  }
}

export function hasStudyAiPending(threadId: string): boolean {
  const parsed = readPending();
  return Boolean(parsed && parsed.threadId === threadId);
}

export function takeStudyAiPending(
  threadId: string
): { text: string; imageBase64?: string } | null {
  const parsed = readPending();
  if (!parsed || parsed.threadId !== threadId) return null;
  sessionStorage.removeItem(KEY);
  const text = String(parsed.text ?? "").trim();
  if (!text && !parsed.imageBase64) return null;
  return { text, imageBase64: parsed.imageBase64 };
}
