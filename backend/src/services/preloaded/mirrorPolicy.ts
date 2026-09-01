import type { IngestLicense, IngestLinkStatus } from "@prisma/client";
import { isPdfUrl } from "../curriculumSavePolicy.js";

export type MirrorCandidate = {
  sourceLicense: IngestLicense | null;
  pdfKey: string | null;
  sourceUrl: string | null;
  linkStatus: IngestLinkStatus;
  embeddable: boolean | null;
};

/** Official docs we may mirror to admin S3 when in-app embed is unreliable. */
export function shouldMirrorPreloadedArticle(article: MirrorCandidate): boolean {
  if (article.sourceLicense !== "OFFICIAL_DOCUMENT") return false;
  if (article.pdfKey) return false;
  if (article.linkStatus !== "OK") return false;

  const url = article.sourceUrl?.trim();
  if (!url || !isPdfUrl(url)) return false;

  if (article.embeddable === true) return false;
  return true;
}

export function preloadedMirrorEnabled(): boolean {
  return process.env.PRELOADED_MIRROR_PDF === "true";
}
