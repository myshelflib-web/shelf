/** Official PDF URLs should use PdfViewer + backend proxy, not an iframe. */
export function isPdfSourceUrl(url: string | null | undefined): boolean {
  return Boolean(url && /\.pdf($|\?|#)/i.test(url));
}

/** Whether to attempt an iframe embed for a linked page (not PDF). */
export function shouldUseLinkEmbed(opts: {
  sourceUrl: string | null | undefined;
  embeddable?: boolean | null;
  linkStatus?: string | null;
}): boolean {
  if (!opts.sourceUrl || isPdfSourceUrl(opts.sourceUrl)) return false;
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
}): boolean | null {
  if (!opts.sourceUrl || isPdfSourceUrl(opts.sourceUrl)) return false;
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
