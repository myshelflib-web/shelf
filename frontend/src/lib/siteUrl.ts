/** Canonical public origin for sitemap, JSON-LD, and Open Graph URLs. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(
    /^https?:\/\//,
    ""
  );
  if (production) return `https://${production}`;

  const preview = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
  if (preview && process.env.VERCEL_ENV === "preview") {
    return `https://${preview}`;
  }

  return "http://localhost:3000";
}
