const DEV_HINT =
  /\b(set|add)\s+[A-Z][A-Z0-9_]*|TELEGRAM_BOT|GOOGLE_CLIENT|RAZORPAY_|LLM_|EMBEDDING_|RESEND_|OPENAI_API_KEY|\.env|env var|on the backend|\bis not set\b/i;

function looksLikeDevError(message: string): boolean {
  return DEV_HINT.test(message) || /\bnot configured\b/i.test(message);
}

/** Hide env-var / setup hints from production API responses. */
export function toUserFacingError(
  message: string,
  fallback = "Something went wrong. Please try again."
): string {
  if (process.env.NODE_ENV !== "production") return message;
  const text = message.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  if (!looksLikeDevError(text)) return text;

  const lower = text.toLowerCase();
  if (/telegram/.test(lower)) {
    return "Telegram isn’t available right now. Please try again later.";
  }
  if (/google|oauth/.test(lower)) {
    return "Google sign-in isn’t available right now. Please try again later.";
  }
  if (/payment|razorpay|subscribe/.test(lower)) {
    return "Payments aren’t available right now. Please try again later.";
  }
  if (/study ai|llm/.test(lower)) {
    return "Study AI isn’t available right now. Please try again later.";
  }
  if (/embedding|vector/.test(lower)) {
    return "Search isn’t fully available right now. Please try again later.";
  }
  return "This feature isn’t available right now. Please try again later.";
}
