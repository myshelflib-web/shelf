import type { StudyGoal } from "@prisma/client";
import { fetchWithRetry } from "../../../utils/fetchRetry.js";
import { adminDocPrefix } from "../../../utils/docPaths.js";
import { getFromS3, uploadToS3 } from "../../s3.js";
import type { ItemOutcome } from "../contentGenJobs.js";
import {
  buildPhotoFigure,
  injectPhotoIntoHtml,
  isVisuallyEnriched,
} from "./injectPhotos.js";
import {
  searchOpenverseImages,
  visualSearchQuery,
  type OpenverseImage,
} from "./openverse.js";

const MAX_IMAGE_BYTES = 2_000_000;

export type EnrichPageInput = {
  studyGoal: StudyGoal;
  subjectSlug: string;
  topicSlug: string;
  slug: string;
  title: string;
  contentUrl: string;
  dryRun: boolean;
  apiPublicBase: string;
};

function mediaUrl(
  base: string,
  subjectSlug: string,
  topicSlug: string,
  slug: string,
  filename: string
): string {
  const root = base.replace(/\/$/, "");
  return `${root}/api/subjects/${encodeURIComponent(subjectSlug)}/topics/${encodeURIComponent(topicSlug)}/articles/${encodeURIComponent(slug)}/media/${encodeURIComponent(filename)}`;
}

function extFromContentType(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes("webp")) return "webp";
  if (lower.includes("png")) return "png";
  return "jpg";
}

function creditLine(hit: OpenverseImage): string {
  const by = hit.creator && hit.creator !== "Unknown" ? hit.creator : "Openverse";
  return `${by} · ${hit.license.toUpperCase()} via Openverse`;
}

async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetchWithRetry(url, {
      timeoutMs: 20_000,
      headers: { Accept: "image/*", "User-Agent": "ShelfContentGen/1.0" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) return null;
    return { buffer: buf, contentType };
  } catch {
    return null;
  }
}

export async function enrichOnePageVisuals(
  input: EnrichPageInput
): Promise<ItemOutcome> {
  const html = await getFromS3(input.contentUrl);
  if (isVisuallyEnriched(html)) {
    return {
      status: "SKIPPED",
      error: "Page already has visual enrichment",
    };
  }

  const query = visualSearchQuery(input.title, input.studyGoal);
  const hits = await searchOpenverseImages(query);
  if (hits.length === 0) {
    return {
      status: "SKIPPED",
      error: `No CC-licensed image found for “${query}”`,
    };
  }

  const hit = hits[0]!;

  if (input.dryRun) {
    return {
      status: "COMPLETED",
      reviewNotes: `Dry run — would add: ${hit.title} (${hit.license})`,
    };
  }

  const downloaded = await downloadImage(hit.imageUrl);
  if (!downloaded) {
    return {
      status: "FAILED",
      error: "Could not download selected Openverse image",
    };
  }

  const prefix = adminDocPrefix(input.subjectSlug, input.topicSlug, input.slug);
  const ext = extFromContentType(downloaded.contentType);
  const figureKey = `${prefix}/figures/figure-1.${ext}`;
  await uploadToS3(figureKey, downloaded.buffer, downloaded.contentType);

  const src = mediaUrl(
    input.apiPublicBase,
    input.subjectSlug,
    input.topicSlug,
    input.slug,
    `figure-1.${ext}`
  );
  const figureHtml = buildPhotoFigure({
    src,
    alt: hit.title,
    caption: hit.title,
    creditLine: creditLine(hit),
    sourceUrl: hit.landingUrl,
  });
  const nextHtml = injectPhotoIntoHtml(html, figureHtml);
  await uploadToS3(input.contentUrl, nextHtml, "text/html; charset=utf-8");

  return {
    status: "COMPLETED",
    reviewNotes: `Added photo: ${hit.title} (${hit.license})`,
  };
}
