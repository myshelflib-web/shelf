import type { IngestLinkStatus } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { checkPublicLink } from "../publicLinkCheck.js";

export type LinkCheckResult = {
  linkStatus: IngestLinkStatus;
  embeddable: boolean | null;
  lastHttpStatus: number | null;
  finalUrl: string;
};

export async function checkIngestItemLink(itemId: string): Promise<LinkCheckResult> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    select: { id: true, canonicalUrl: true, sourcePdfUrl: true },
  });
  if (!item) throw new Error("Ingest item not found.");

  const url = item.sourcePdfUrl ?? item.canonicalUrl;
  const result = await checkPublicLink(url);
  await persistLinkCheck(itemId, result);
  logger.info("ingest.link_check.ok", {
    itemId,
    linkStatus: result.linkStatus,
    httpStatus: result.lastHttpStatus,
    embeddable: result.embeddable,
  });
  return result;
}

async function persistLinkCheck(itemId: string, result: LinkCheckResult): Promise<void> {
  await prisma.ingestItem.update({
    where: { id: itemId },
    data: {
      linkStatus: result.linkStatus,
      embeddable: result.embeddable,
      lastHttpStatus: result.lastHttpStatus,
      lastLinkCheckAt: new Date(),
    },
  });
}

export async function runLinkHealthBatch(
  limit = Number(process.env.INGEST_LINK_CHECK_BATCH ?? 30)
): Promise<number> {
  const staleBefore = new Date(
    Date.now() - Number(process.env.INGEST_LINK_CHECK_STALE_MS ?? 86_400_000)
  );

  const items = await prisma.ingestItem.findMany({
    where: {
      status: { in: ["PUBLISHED", "APPROVED"] },
      OR: [{ lastLinkCheckAt: null }, { lastLinkCheckAt: { lt: staleBefore } }],
    },
    orderBy: [{ lastLinkCheckAt: "asc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true },
  });

  let checked = 0;
  for (const item of items) {
    try {
      await checkIngestItemLink(item.id);
      checked += 1;
    } catch (err) {
      logger.warn("ingest.link_check.failed", {
        itemId: item.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (checked > 0) {
    logger.info("ingest.link_check.batch", { checked, requested: items.length });
  }
  return checked;
}
