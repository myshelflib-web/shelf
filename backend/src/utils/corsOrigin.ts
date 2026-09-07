/**
 * CORS allowlist helpers.
 * Exact origins from CORS_ORIGIN; optional Vercel preview hosts for staging.
 */

const VERCEL_PREVIEW_ORIGIN =
  /^https:\/\/([a-z0-9-]+\.)+vercel\.app$/i;

export function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

export function allowVercelPreviewCors(
  raw: string | undefined = process.env.ALLOW_VERCEL_PREVIEW_CORS
): boolean {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isVercelPreviewOrigin(origin: string): boolean {
  return VERCEL_PREVIEW_ORIGIN.test(origin);
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  allowVercelPreviews: boolean
): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && isVercelPreviewOrigin(origin)) return true;
  return false;
}
