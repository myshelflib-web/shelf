/** True in local dev / preview builds; false in production deploys. */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

const DEV_HINT =
  /\b(set|add)\s+[A-Z][A-Z0-9_]*|NEXT_PUBLIC_|TELEGRAM_BOT|GOOGLE_CLIENT|RAZORPAY_|LLM_|EMBEDDING_|RESEND_|OPENAI_API_KEY|\.env|env var|on the backend|on vercel|minio\/r2|bucket cors|\bis not set\b/i;

export function looksLikeDevError(message: string): boolean {
  return DEV_HINT.test(message) || /\bnot configured\b/i.test(message);
}

/** Hide env-var / setup hints from production users. */
export function toUserFacingError(
  message: string,
  fallback = "Something went wrong. Please try again."
): string {
  if (isDevEnvironment()) return message;
  const text = message.replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  if (!looksLikeDevError(text) && !/bot domain invalid|username invalid|bot id invalid/i.test(text)) {
    return text;
  }

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
  if (/server|reach|network|storage|minio|cors/.test(lower)) {
    return "Couldn’t reach the server. Check your connection and try again.";
  }
  return "This feature isn’t available right now. Please try again later.";
}
