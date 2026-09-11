/**
 * CORS allowlist helpers.
 * Exact origins from CORS_ORIGIN; optional Vercel preview hosts for staging.
 * Local mobile: private LAN http origins when not in production.
 */

const VERCEL_PREVIEW_ORIGIN =
  /^https:\/\/([a-z0-9-]+\.)+vercel\.app$/i;

export function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? "http://localhost:3000,http://10.0.2.2:3000")
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

/**
 * Allow http://192.168.x.x:3000 (and other RFC1918) for Capacitor on a phone/emulator
 * using the Mac LAN IP. Off in production unless ALLOW_LAN_CORS=true.
 */
export function allowLanDevCors(
  raw: string | undefined = process.env.ALLOW_LAN_CORS,
  nodeEnv: string | undefined = process.env.NODE_ENV,
  deployment: string | undefined = process.env.OTEL_DEPLOYMENT_ENVIRONMENT
): boolean {
  const flag = (raw ?? "").trim().toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
  if (flag === "0" || flag === "false" || flag === "no") return false;
  const deploy = (deployment ?? "").trim().toLowerCase();
  if (deploy === "production" || deploy === "prod") return false;
  if ((nodeEnv ?? "").trim().toLowerCase() === "production") return false;
  return true;
}

/** http://localhost, 10.0.2.2, or private LAN IPv4 (RFC1918). */
export function isPrivateLanHttpOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "10.0.2.2" ||
      host === "[::1]" ||
      host === "::1"
    ) {
      return true;
    }
    const parts = host.split(".").map((p) => Number(p));
    if (
      parts.length !== 4 ||
      parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
    ) {
      return false;
    }
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
  } catch {
    return false;
  }
}

export function isVercelPreviewOrigin(origin: string): boolean {
  return VERCEL_PREVIEW_ORIGIN.test(origin);
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[],
  allowVercelPreviews: boolean,
  allowLan: boolean = false
): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (allowVercelPreviews && isVercelPreviewOrigin(origin)) return true;
  if (allowLan && isPrivateLanHttpOrigin(origin)) return true;
  return false;
}
