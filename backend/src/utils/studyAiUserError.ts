/**
 * Map provider / transport errors to short copy safe for the UI and chat history.
 * Never surface raw JSON, stack traces, or Gemini internals (e.g. thought_signature).
 */
export function mapStudyAiErrorMessage(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) {
    return "Study AI couldn’t finish that reply. Please try again.";
  }

  const lower = text.toLowerCase();

  // Already a short Shelf-authored message (no JSON / status dumps).
  if (
    text.startsWith("Study AI ") &&
    text.length <= 180 &&
    !text.includes("{") &&
    !text.includes("[") &&
    !/error \(\d+\)|request failed \(\d+\)/i.test(text)
  ) {
    return text;
  }
  if (
    (text.startsWith("Gemini free-tier") || text.startsWith("Study AI quota")) &&
    text.length < 220
  ) {
    return text;
  }

  if (
    /thought_signature|function call is missing|functioncall parts|missing a thought/i.test(
      text
    )
  ) {
    return "Study AI hit a temporary glitch. Please try again.";
  }

  if (
    /abort(ed)?|aborterror|the operation was aborted|request was cancelled/i.test(
      lower
    )
  ) {
    return "Stopped.";
  }

  if (
    /429|rate limit|resource.?exhausted|too many requests|quota exceeded|free.?tier/i.test(
      lower
    )
  ) {
    return "Study AI is busy right now. Wait a moment and try again.";
  }

  if (/401|403|api key is invalid|invalid.*api.?key|unauthorized/i.test(lower)) {
    return "Study AI isn’t configured correctly. Please try again later.";
  }

  if (
    /network|fetch failed|econnrefused|etimedout|failed to fetch|offline/i.test(
      lower
    )
  ) {
    return "Couldn’t reach Study AI. Check your connection and try again.";
  }

  if (/empty response|could not finish this reply\.?$/i.test(lower)) {
    return "Study AI couldn’t finish that reply. Please try again.";
  }

  return "Study AI couldn’t finish that reply. Please try again.";
}

export function toUserFacingStudyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  return mapStudyAiErrorMessage(raw);
}

/** Stub stored on the assistant turn when a stream fails. */
export function studyAiFailureStub(err: unknown): string {
  return toUserFacingStudyError(err);
}
