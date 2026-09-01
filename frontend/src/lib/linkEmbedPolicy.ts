import type { IngestLicense } from "@/types";

/** Official PDF URLs should use PdfViewer + backend proxy, not an iframe. */
export function isPdfSourceUrl(url: string | null | undefined): boolean {
  return Boolean(url && /\.pdf($|\?|#)/i.test(url));
}

const NON_EMBED_HOST_SUFFIXES = [
  ".gov.in",
  ".nic.in",
  ".org.in",
  ".ac.in",
  ".edu.in",
] as const;

const NON_EMBED_EXACT_HOSTS = new Set(["icai.org", "www.icai.org"]);

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

function linkEmbedBlockedByPolicy(opts: {
  sourceUrl: string | null | undefined;
  sourceLicense?: IngestLicense | null;
}): boolean {
  if (opts.sourceLicense === "LINK_ONLY") return true;
  return isKnownNonEmbedUrl(opts.sourceUrl);
}

/** Whether to attempt an iframe embed for a linked page (not PDF). */
export function shouldUseLinkEmbed(opts: {
  sourceUrl: string | null | undefined;
  embeddable?: boolean | null;
  linkStatus?: string | null;
  sourceLicense?: IngestLicense | null;
}): boolean {
  if (!opts.sourceUrl || isPdfSourceUrl(opts.sourceUrl)) return false;
  if (linkEmbedBlockedByPolicy(opts)) return false;
  if (opts.embeddable === false) return false;
  if (opts.linkStatus === "BROKEN" || opts.linkStatus === "BLOCKED_EMBED") {
    return false;
  }
  return opts.embeddable === true;
}

/** true = embed, false = blocked, null = probe embed-status on open. */
export function linkEmbedHint(opts: {
  sourceUrl: string | null | undefined;
  embeddable?: boolean | null;
  linkStatus?: string | null;
  sourceLicense?: IngestLicense | null;
}): boolean | null {
  if (!opts.sourceUrl || isPdfSourceUrl(opts.sourceUrl)) return false;
  if (linkEmbedBlockedByPolicy(opts)) return false;
  if (shouldUseLinkEmbed(opts)) return true;
  if (
    opts.embeddable === false ||
    opts.linkStatus === "BROKEN" ||
    opts.linkStatus === "BLOCKED_EMBED"
  ) {
    return false;
  }
  return null;
}

export function linkEmbedBlockedMessage(linkStatus?: string | null): string {
  if (linkStatus === "BROKEN") {
    return "This official link is unavailable (404 or server error). Open the source site or pick another resource.";
  }
  return "Most government and university sites block in-app embeds. Open the official page in your browser, or save a copy to your library when allowed.";
}
