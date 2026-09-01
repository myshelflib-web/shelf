import type { IngestLicense } from "@prisma/client";

/** Max chars we may store from a third-party RSS description (not scraped body). */
export const RSS_DESCRIPTION_MAX = 280;

/** Max chars for our original Shelf summary (never copy full articles). */
export const SHELF_SUMMARY_MAX = 600;

export type StoredContent = {
  shelfSummary: string;
  factualExcerpt: string | null;
  fullDocumentStored: boolean;
};

export function trimExcerpt(text: string | null | undefined): string | null {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  if (cleaned.length <= RSS_DESCRIPTION_MAX) return cleaned;
  return `${cleaned.slice(0, RSS_DESCRIPTION_MAX - 1)}…`;
}

export function buildShelfSummary(parts: {
  title: string;
  excerpt?: string | null;
  sourceName: string;
}): string {
  const title = parts.title.trim();
  const excerpt = (parts.excerpt ?? "").trim();
  const lead = excerpt
    ? `Brief: ${excerpt}`
    : `Headline from ${parts.sourceName}. Open the source link for the full release.`;
  const summary = `${title}. ${lead}`.replace(/\s+/g, " ").trim();
  if (summary.length <= SHELF_SUMMARY_MAX) return summary;
  return `${summary.slice(0, SHELF_SUMMARY_MAX - 1)}…`;
}

export function applyLicensePolicy(
  license: IngestLicense,
  input: {
    title: string;
    rssDescription?: string | null;
    sourceName: string;
    isPdfDownload?: boolean;
  }
): StoredContent {
  if (license === "OFFICIAL_DOCUMENT" && input.isPdfDownload) {
    return {
      shelfSummary: buildShelfSummary({
        title: input.title,
        excerpt: `Official document from ${input.sourceName}. View on the official site; save to your library for a personal copy.`,
        sourceName: input.sourceName,
      }),
      factualExcerpt: null,
      fullDocumentStored: false,
    };
  }

  const excerpt =
    license === "LINK_ONLY"
      ? null
      : trimExcerpt(input.rssDescription ?? null);

  return {
    shelfSummary: buildShelfSummary({
      title: input.title,
      excerpt,
      sourceName: input.sourceName,
    }),
    factualExcerpt: excerpt,
    fullDocumentStored: false,
  };
}

export function mayFetchPageBody(license: IngestLicense): boolean {
  return license === "OFFICIAL_DOCUMENT";
}
