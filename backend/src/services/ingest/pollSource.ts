import type { IngestSource } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { applyLicensePolicy } from "./copyrightPolicy.js";
import { ingestContentHash } from "./contentHash.js";
import { fetchRssFeed } from "./rssParser.js";
import { publishIngestMessage } from "./sqsPublisher.js";
import { createIngestJob } from "./ingestJobs.js";
import { parsePublicHttpUrl } from "../../utils/publicUrl.js";
import { fetchWithRetry } from "../../utils/fetchRetry.js";
import { ingestFetchHeaders } from "./ingestHttp.js";
import { createIngestItemSlug } from "./ingestItemSlug.js";

function configTags(source: IngestSource): string[] {
  const cfg = source.config as { tags?: string[] } | null;
  return cfg?.tags ?? [];
}

function extractPdfLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /href=["']([^"']+\.pdf[^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const abs = new URL(m[1], baseUrl).toString();
      const safe = parsePublicHttpUrl(abs);
      if (safe) links.add(safe);
    } catch {
      /* skip bad URLs */
    }
  }
  return [...links];
}

function editionFromTitle(title: string): string | null {
  const year = title.match(/\b(20\d{2})\b/);
  return year?.[1] ?? null;
}

async function pollOfficialPage(source: IngestSource): Promise<number> {
  const safe = parsePublicHttpUrl(source.feedUrl);
  if (!safe) throw new Error("Source feed URL is not allowed.");

  const res = await fetchWithRetry(safe, {
    timeoutMs: 25_000,
    redirect: "follow",
    headers: ingestFetchHeaders(),
  });
  if (!res.ok) throw new Error(`Page fetch failed (${res.status}).`);

  const html = await res.text();
  const pdfLinks = extractPdfLinks(html, safe);
  const cfg = source.config as { pdfLinkPattern?: string } | null;
  const pattern = cfg?.pdfLinkPattern ? new RegExp(cfg.pdfLinkPattern, "i") : /\.pdf/i;

  const candidates = pdfLinks.filter((url) => pattern.test(url)).slice(0, source.maxItemsPerRun);
  let created = 0;

  for (const pdfUrl of candidates) {
    const title = pdfUrl.split("/").pop()?.replace(/\.pdf$/i, "").replace(/[-_]+/g, " ") ?? "Official document";
    const edition = editionFromTitle(title);
    const hash = ingestContentHash({
      title,
      canonicalUrl: pdfUrl,
      edition,
    });

    const existing = await prisma.ingestItem.findUnique({
      where: { sourceId_contentHash: { sourceId: source.id, contentHash: hash } },
      select: { id: true },
    });
    if (existing) continue;

    const stored = applyLicensePolicy(source.license, {
      title,
      sourceName: source.name,
      isPdfDownload: source.license === "OFFICIAL_DOCUMENT",
    });

    const item = await prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        slug: await createIngestItemSlug(title, edition),
        title,
        canonicalUrl: pdfUrl,
        contentHash: hash,
        license: source.license,
        studyGoals: source.studyGoals,
        tags: configTags(source),
        edition,
        sourcePdfUrl: pdfUrl,
        shelfSummary: stored.shelfSummary,
        factualExcerpt: stored.factualExcerpt,
        fullDocumentStored: stored.fullDocumentStored,
        status: source.license === "OFFICIAL_DOCUMENT" ? "FETCHED" : "PENDING_REVIEW",
      },
      select: { id: true },
    });

    const job = await createIngestJob({
      phase: "FETCH",
      sourceId: source.id,
      itemId: item.id,
    });
    await publishIngestMessage({
      phase: "FETCH",
      sourceId: source.id,
      itemId: item.id,
      jobId: job.id,
    });
    created += 1;
  }

  if (source.license === "LINK_ONLY" && created === 0) {
    const hash = ingestContentHash({ title: source.name, canonicalUrl: safe });
    const existing = await prisma.ingestItem.findUnique({
      where: { sourceId_contentHash: { sourceId: source.id, contentHash: hash } },
    });
    if (!existing) {
      const stored = applyLicensePolicy(source.license, {
        title: `${source.name} — check for updates`,
        sourceName: source.name,
      });
      const item = await prisma.ingestItem.create({
        data: {
          sourceId: source.id,
          slug: await createIngestItemSlug(source.name),
          title: stored.shelfSummary.split(".")[0] ?? source.name,
          canonicalUrl: safe,
          contentHash: hash,
          license: source.license,
          studyGoals: source.studyGoals,
          tags: configTags(source),
          shelfSummary: stored.shelfSummary,
          status: "PENDING_REVIEW",
        },
        select: { id: true },
      });
      const job = await createIngestJob({ phase: "PROCESS", sourceId: source.id, itemId: item.id });
      await publishIngestMessage({
        phase: "PROCESS",
        sourceId: source.id,
        itemId: item.id,
        jobId: job.id,
      });
      created = 1;
    }
  }

  return created;
}

async function pollRss(source: IngestSource): Promise<number> {
  const entries = await fetchRssFeed(source.feedUrl);
  const slice = entries.slice(0, source.maxItemsPerRun);
  let created = 0;

  for (const entry of slice) {
    const hash = ingestContentHash({
      title: entry.title,
      canonicalUrl: entry.canonicalUrl,
      publishedAt: entry.publishedAt,
    });
    const existing = await prisma.ingestItem.findUnique({
      where: { sourceId_contentHash: { sourceId: source.id, contentHash: hash } },
      select: { id: true },
    });
    if (existing) continue;

    const stored = applyLicensePolicy(source.license, {
      title: entry.title,
      rssDescription: entry.description,
      sourceName: source.name,
    });

    const item = await prisma.ingestItem.create({
      data: {
        sourceId: source.id,
        slug: await createIngestItemSlug(entry.title, entry.publishedAt?.getFullYear?.() ? String(entry.publishedAt.getFullYear()) : null),
        externalId: entry.externalId,
        title: entry.title,
        canonicalUrl: entry.canonicalUrl,
        publishedAt: entry.publishedAt,
        contentHash: hash,
        license: source.license,
        studyGoals: source.studyGoals,
        tags: configTags(source),
        shelfSummary: stored.shelfSummary,
        factualExcerpt: stored.factualExcerpt,
        fullDocumentStored: stored.fullDocumentStored,
        status: "FETCHED",
      },
      select: { id: true },
    });

    const job = await createIngestJob({ phase: "PROCESS", sourceId: source.id, itemId: item.id });
    await publishIngestMessage({
      phase: "PROCESS",
      sourceId: source.id,
      itemId: item.id,
      jobId: job.id,
    });
    created += 1;
  }

  return created;
}

export async function pollIngestSource(sourceId: string): Promise<{ created: number }> {
  const source = await prisma.ingestSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error("Source not found.");
  if (!source.enabled) throw new Error("Source is disabled.");

  try {
    let created = 0;
    if (source.kind === "RSS") {
      created = await pollRss(source);
    } else {
      created = await pollOfficialPage(source);
    }

    await prisma.ingestSource.update({
      where: { id: sourceId },
      data: {
        lastPolledAt: new Date(),
        lastSuccessAt: new Date(),
        lastError: null,
      },
    });

    const archiveJob = await createIngestJob({ phase: "ARCHIVE", sourceId });
    await publishIngestMessage({
      phase: "ARCHIVE",
      sourceId,
      jobId: archiveJob.id,
    });

    logger.info("ingest.poll.ok", { sourceId, slug: source.slug, created });
    return { created };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.ingestSource.update({
      where: { id: sourceId },
      data: { lastPolledAt: new Date(), lastError: message.slice(0, 2000) },
    });
    throw err;
  }
}
