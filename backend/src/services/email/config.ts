import {
  SHELF_EMAIL_LOGO_BASE64,
  SHELF_EMAIL_LOGO_CID,
} from "./logoDataUri.js";

/** Public app URL for email links. */
export function getAppUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
  if (cors) return cors.replace(/\/$/, "");

  return "http://localhost:3000";
}

/**
 * Logo `<img src>` for emails.
 * Default: Resend CID inline attachment (works in Gmail — data: URIs do not).
 * Override with EMAIL_LOGO_URL for a hosted https image.
 */
export function getEmailLogoSrc(): string {
  const custom = process.env.EMAIL_LOGO_URL?.trim();
  if (custom) return custom;
  return `cid:${SHELF_EMAIL_LOGO_CID}`;
}

/** Inline logo attachment for Resend, or null when using EMAIL_LOGO_URL. */
export function getEmailLogoAttachment():
  | {
      filename: string;
      content: string;
      contentId: string;
      contentType: string;
    }
  | null {
  if (process.env.EMAIL_LOGO_URL?.trim()) return null;
  return {
    filename: "shelf-logo.png",
    content: SHELF_EMAIL_LOGO_BASE64,
    contentId: SHELF_EMAIL_LOGO_CID,
    contentType: "image/png",
  };
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
