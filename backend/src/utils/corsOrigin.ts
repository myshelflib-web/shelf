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

/**
 * Origins written to the S3/R2 bucket CORS policy (browser PUT/GET).
 * Separate from API CORS: R2 cannot use a regex for `*.vercel.app`.
 * - `S3_CORS_ORIGINS` overrides when set (e.g. `*` on staging).
 * - With `ALLOW_VERCEL_PREVIEW_CORS`, default to `*` so preview hosts work.
 * - Otherwise mirror `CORS_ORIGIN`.
 */
export function resolveBucketCorsOrigins(
  corsOrigin: string | undefined = process.env.CORS_ORIGIN,
  allowVercelPreviews: boolean = allowVercelPreviewCors(),
  s3CorsOrigins: string | undefined = process.env.S3_CORS_ORIGINS
): string[] {
  const override = s3CorsOrigins?.trim();
  if (override) {
    return override
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
  }
  if (allowVercelPreviews) {
    return ["*"];
  }
  return parseCorsOrigins(corsOrigin);
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
