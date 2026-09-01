import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";

/** Archive superseded editions for official doc sources (yearly/monthly cadence). */
export async function archiveSupersededForSource(sourceId: string): Promise<{ archived: number }> {
  const source = await prisma.ingestSource.findUnique({
    where: { id: sourceId },
    select: { cadence: true, slug: true },
  });
  if (!source) throw new Error("Source not found.");

  if (source.cadence !== "YEARLY" && source.cadence !== "MONTHLY") {
    return { archived: 0 };
  }

  const published = await prisma.ingestItem.findMany({
    where: {
      sourceId,
      status: "PUBLISHED",
      edition: { not: null },
      articleId: { not: null },
    },
    orderBy: [{ edition: "desc" }, { publishedAtShelf: "desc" }],
    select: {
      id: true,
      edition: true,
      articleId: true,
    },
  });

  if (published.length <= 1) return { archived: 0 };

  const latestEdition = published[0]?.edition;
  if (!latestEdition) return { archived: 0 };

  const stale = published.filter((row) => row.edition !== latestEdition);
  let archived = 0;

  for (const row of stale) {
    await prisma.ingestItem.update({
      where: { id: row.id },
      data: { status: "SUPERSEDED", supersededById: published[0].id },
    });

    if (row.articleId) {
      await prisma.article.update({
        where: { id: row.articleId },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
          supersededById: published[0].articleId ?? undefined,
        },
      });
    }
    archived += 1;
  }

  if (archived > 0) {
    logger.info("ingest.archive.ok", { sourceId, slug: source.slug, archived, latestEdition });
  }

  return { archived };
}
