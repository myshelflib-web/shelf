/** Canonical public origin for sitemap, JSON-LD, and Open Graph URLs. */

/**
 * Apex myshelflib.com 308s to www on Vercel. Prefer www so sitemap,
 * canonical, and Open Graph URLs match the live host Google indexes.
 */
function preferWwwCanonical(origin: string): string {
  try {
    const url = new URL(origin);
    if (url.hostname === "myshelflib.com") {
      url.hostname = "www.myshelflib.com";
    }
    return url.origin;
  } catch {
    return origin.replace(/\/$/, "");
  }
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (explicit) return preferWwwCanonical(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(
    /^https?:\/\//,
    ""
  );
  if (production) {
    return preferWwwCanonical(`https://${production}`);
  }

  const preview = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
  if (preview && process.env.VERCEL_ENV === "preview") {
    return `https://${preview}`;
  }

  return "http://localhost:3000";
}
