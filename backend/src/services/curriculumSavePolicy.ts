import type { IngestLicense } from "@prisma/client";

export type CurriculumSaveMode =
  | "copy_admin"
  | "download_remote"
  | "link"
  | "none";

export type CurriculumSavePolicy = {
  allowed: boolean;
  mode: CurriculumSaveMode;
  embedUrl: string | null;
  reason: string;
  license: IngestLicense | null;
};

type ArticleLike = {
  pdfKey: string | null;
  contentUrl: string | null;
  sourceUrl: string | null;
  sourceLicense?: IngestLicense | null;
  ingestItem?: { license: IngestLicense } | null;
};

function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?|#)/i.test(url);
}

function resolveLicense(article: ArticleLike): IngestLicense | null {
  return article.ingestItem?.license ?? article.sourceLicense ?? null;
}

/** Public embed URL for preloaded Learn reader (no admin S3 PDF). */
export function curriculumEmbedUrl(article: ArticleLike): string | null {
  if (article.pdfKey) return null;
  const url = article.sourceUrl?.trim();
  return url || null;
}

export function resolveCurriculumSavePolicy(
  article: ArticleLike
): CurriculumSavePolicy {
  const embedUrl = curriculumEmbedUrl(article);
  const license = resolveLicense(article);

  if (article.pdfKey) {
    return {
      allowed: true,
      mode: "copy_admin",
      embedUrl: null,
      license,
      reason: "Save a personal copy from Shelf's catalog file.",
    };
  }

  if (article.contentUrl && !article.sourceUrl) {
    return {
      allowed: true,
      mode: "copy_admin",
      embedUrl: null,
      license,
      reason: "Save a copy of this Shelf-hosted summary.",
    };
  }

  const url = article.sourceUrl?.trim();
  if (!url) {
    return {
      allowed: false,
      mode: "none",
      embedUrl: null,
      license,
      reason: "Nothing available to save for this item.",
    };
  }

  if (license === "LINK_ONLY") {
    return {
      allowed: true,
      mode: "link",
      embedUrl,
      license,
      reason: "Official link only — saves as a bookmark in your library (no file copy).",
    };
  }

  if (license === "GOVERNMENT_PRESS") {
    return {
      allowed: true,
      mode: "link",
      embedUrl,
      license,
      reason: "Government press — save as a link; read full text at the source.",
    };
  }

  if (license === "OFFICIAL_DOCUMENT") {
    return {
      allowed: true,
      mode: "download_remote",
      embedUrl,
      license,
      reason: "Official document — downloads to your library only when you save.",
    };
  }

  if (!license) {
    return {
      allowed: true,
      mode: "link",
      embedUrl,
      license: null,
      reason:
        "Download not available — saves as an official link in your library.",
    };
  }

  if (isPdfUrl(url) && license !== "OFFICIAL_DOCUMENT") {
    return {
      allowed: true,
      mode: "link",
      embedUrl,
      license,
      reason:
        "Save as a link to the official source (file download not offered).",
    };
  }

  return {
    allowed: true,
    mode: "link",
    embedUrl,
    license,
    reason: "Save as an official link in your library.",
  };
}
