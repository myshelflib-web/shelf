/** Server-only config (no NEXT_PUBLIC_ prefix). Safe to pass Google client ID to the browser — it is not a secret. */
export function resolveGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
    ""
  ).trim();
}

/** Bot username is public (not the token). Prefer TELEGRAM_BOT_USERNAME like GOOGLE_CLIENT_ID. */
export function resolveTelegramBotUsername(): string {
  return (
    process.env.TELEGRAM_BOT_USERNAME ??
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
    ""
  ).trim();
}
