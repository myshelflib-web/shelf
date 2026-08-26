/** Public app URL for email links and assets (logo). */
export function getAppUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
  if (cors) return cors.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function getEmailLogoUrl(): string {
  const custom = process.env.EMAIL_LOGO_URL?.trim();
  if (custom) return custom;
  return `${getAppUrl()}/icons/shelf-icon-2048.png`;
}

export function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

/** From address, e.g. `Shelf <noreply@yourdomain.com>`. */
export function getEmailFrom(): string | undefined {
  return (
    process.env.EMAIL_FROM?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    undefined
  );
}

export function isEmailConfigured(): boolean {
  return Boolean(getResendApiKey() && getEmailFrom());
}
