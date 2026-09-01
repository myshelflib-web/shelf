import type { IngestLicense, IngestLinkStatus } from "@prisma/client";

/** Host suffixes that almost always block or break in-app iframes. */
const NON_EMBED_HOST_SUFFIXES = [
  ".gov.in",
  ".nic.in",
  ".org.in",
  ".ac.in",
  ".edu.in",
] as const;

const NON_EMBED_EXACT_HOSTS = new Set([
  "icai.org",
  "www.icai.org",
]);

export function isKnownNonEmbedUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    if (NON_EMBED_EXACT_HOSTS.has(host)) return true;
    return NON_EMBED_HOST_SUFFIXES.some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix)
    );
  } catch {
    return false;
  }
}

export function linkEmbedBlockedByPolicy(opts: {
  sourceUrl: string | null | undefined;
  license?: IngestLicense | null;
}): boolean {
  if (opts.license === "LINK_ONLY") return true;
  return isKnownNonEmbedUrl(opts.sourceUrl);
}

/** Normalize stored / probed embed flags before API responses and DB writes. */
export function effectiveLinkEmbeddable(opts: {
  sourceUrl: string | null | undefined;
  license?: IngestLicense | null;
  embeddable: boolean | null;
  linkStatus?: IngestLinkStatus | string | null;
}): boolean | null {
  if (!opts.sourceUrl?.trim()) return false;
  if (linkEmbedBlockedByPolicy(opts)) return false;
  if (opts.linkStatus === "BROKEN" || opts.linkStatus === "BLOCKED_EMBED") {
    return false;
  }
  if (opts.embeddable === false) return false;
  if (opts.embeddable === true) return true;
  return null;
}

export function applyLinkEmbedPolicy<
  T extends { embeddable: boolean | null; linkStatus: IngestLinkStatus },
>(result: T, opts: { sourceUrl: string; license?: IngestLicense | null }): T {
  if (!linkEmbedBlockedByPolicy({ sourceUrl: opts.sourceUrl, license: opts.license })) {
    return result;
  }
  return {
    ...result,
    embeddable: false,
    linkStatus: result.linkStatus === "BROKEN" ? "BROKEN" : "BLOCKED_EMBED",
  };
}
