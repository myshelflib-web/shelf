import { SHELF_EMAIL_LOGO_DATA_URI } from "./logoDataUri.js";

/** Public app URL for email links and assets (logo). */
export function getAppUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
  if (cors) return cors.replace(/\/$/, "");

  return "http://localhost:3000";
}

/** Logo src for email `<img>` — embedded by default; override with EMAIL_LOGO_URL. */
export function getEmailLogoSrc(): string {
  const custom = process.env.EMAIL_LOGO_URL?.trim();
  if (custom) return custom;
  return SHELF_EMAIL_LOGO_DATA_URI;
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
