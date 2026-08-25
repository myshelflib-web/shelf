/** Server-only config (no NEXT_PUBLIC_ prefix). Safe to pass Google client ID to the browser — it is not a secret. */
export function resolveGoogleClientId(): string {
  return (
    process.env.GOOGLE_CLIENT_ID ??
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
    ""
  ).trim();
}
