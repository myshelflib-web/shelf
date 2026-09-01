import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import {
  checkPublicLink,
  sameHostname,
  type PublicLinkCheckResult,
} from "../publicLinkCheck.js";
import { suggestOfficialUrl } from "./urlRepair.js";

export type ArticleLinkCheckResult = PublicLinkCheckResult & {
  sourceUrlUpdated: boolean;
  repaired: boolean;
};

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function repairsTodayCount(): Promise<number> {
  return prisma.article.count({
    where: { lastUrlRepairAt: { gte: startOfUtcDay() } },
  });
}

function repairCooldownMs(): number {
  return Number(process.env.PRELOADED_URL_REPAIR_COOLDOWN_MS ?? 2_592_000_000);
}

function maxRepairsPerDay(): number {
  return Number(process.env.PRELOADED_URL_REPAIR_MAX_PER_DAY ?? 3);
}

async function maybeRepairArticleUrl(articleId: string): Promise<boolean> {
  if (process.env.PRELOADED_URL_REPAIR !== "true") return false;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      topic: {
        select: {
          title: true,
          subject: { select: { name: true, studyGoal: true } },
        },
      },
    },
  });
  if (!article?.sourceUrl) return false;

  const cooldown = repairCooldownMs();
  if (
    article.lastUrlRepairAt &&
    Date.now() - article.lastUrlRepairAt.getTime() < cooldown
  ) {
    return false;
  }

  if ((await repairsTodayCount()) >= maxRepairsPerDay()) {
    logger.info("preloaded.url_repair.daily_cap", { articleId });
    return false;
  }

  const suggestion = await suggestOfficialUrl({
    title: article.title,
    summary: article.summary,
    oldUrl: article.sourceUrl,
    subjectName: article.topic.subject.name,
    topicTitle: article.topic.title,
    studyGoal: article.topic.subject.studyGoal,
  });

  if (!suggestion || suggestion.confidence === "low") return false;

  const verified = await checkPublicLink(suggestion.url);
  if (verified.linkStatus !== "OK") return false;

  await prisma.article.update({
    where: { id: articleId },
    data: {
      sourceUrl: verified.finalUrl,
      sourceUrlChecked: verified.finalUrl,
      linkStatus: verified.linkStatus,
      embeddable: verified.embeddable,
      lastHttpStatus: verified.lastHttpStatus,
      lastLinkCheckAt: new Date(),
      lastUrlRepairAt: new Date(),
    },
  });

  logger.info("preloaded.url_repair.applied", {
    articleId,
    oldUrl: article.sourceUrl,
    newUrl: verified.finalUrl,
    confidence: suggestion.confidence,
    reason: suggestion.reason,
  });
  return true;
}

function resolveSourceUrlUpdate(
  currentUrl: string,
  result: PublicLinkCheckResult
): string | null {
  if (result.linkStatus !== "OK") return null;
  if (result.finalUrl === currentUrl) return null;
  if (!sameHostname(currentUrl, result.finalUrl)) return null;
  return result.finalUrl;
}

export async function checkArticleLink(articleId: string): Promise<ArticleLinkCheckResult> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, sourceUrl: true, pdfKey: true },
  });
  if (!article) throw new Error("Article not found.");

  const url = article.sourceUrl?.trim();
  if (!url || article.pdfKey) {
    const empty: ArticleLinkCheckResult = {
      linkStatus: "UNKNOWN",
      embeddable: null,
      lastHttpStatus: null,
      finalUrl: url ?? "",
      sourceUrlUpdated: false,
      repaired: false,
    };
    await prisma.article.update({
      where: { id: articleId },
      data: { lastLinkCheckAt: new Date() },
    });
    return empty;
  }

  const result = await checkPublicLink(url);
  const nextSourceUrl = resolveSourceUrlUpdate(url, result);
  let repaired = false;

  await prisma.article.update({
    where: { id: articleId },
    data: {
      linkStatus: result.linkStatus,
      embeddable: result.embeddable,
      lastHttpStatus: result.lastHttpStatus,
      lastLinkCheckAt: new Date(),
      sourceUrlChecked: result.finalUrl,
      ...(nextSourceUrl ? { sourceUrl: nextSourceUrl } : {}),
    },
  });

  if (result.linkStatus === "BROKEN") {
    repaired = await maybeRepairArticleUrl(articleId);
    if (repaired) {
      const refreshed = await prisma.article.findUnique({
        where: { id: articleId },
        select: { sourceUrl: true, linkStatus: true, embeddable: true, lastHttpStatus: true, sourceUrlChecked: true },
      });
      if (refreshed?.sourceUrl) {
        return {
          linkStatus: refreshed.linkStatus,
          embeddable: refreshed.embeddable,
          lastHttpStatus: refreshed.lastHttpStatus,
          finalUrl: refreshed.sourceUrlChecked ?? refreshed.sourceUrl,
          sourceUrlUpdated: true,
          repaired: true,
        };
      }
    }
  }

  logger.info("preloaded.link_check.ok", {
    articleId,
    linkStatus: result.linkStatus,
    httpStatus: result.lastHttpStatus,
    embeddable: result.embeddable,
    sourceUrlUpdated: Boolean(nextSourceUrl),
  });

  return {
    ...result,
    finalUrl: nextSourceUrl ?? result.finalUrl,
    sourceUrlUpdated: Boolean(nextSourceUrl),
    repaired,
  };
}

export async function runArticleLinkHealthBatch(
  limit = Number(process.env.PRELOADED_LINK_CHECK_BATCH ?? 20)
): Promise<number> {
  const staleBefore = new Date(
    Date.now() - Number(process.env.PRELOADED_LINK_CHECK_STALE_MS ?? 604_800_000)
  );

  const articles = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      sourceUrl: { not: null },
      pdfKey: null,
      OR: [{ lastLinkCheckAt: null }, { lastLinkCheckAt: { lt: staleBefore } }],
    },
    orderBy: [{ lastLinkCheckAt: "asc" }, { updatedAt: "desc" }],
    take: limit,
    select: { id: true },
  });

  let checked = 0;
  for (const article of articles) {
    try {
      await checkArticleLink(article.id);
      checked += 1;
    } catch (err) {
      logger.warn("preloaded.link_check.failed", {
        articleId: article.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (checked > 0) {
    logger.info("preloaded.link_check.batch", { checked, requested: articles.length });
  }
  return checked;
}

export async function migratePreloadedArticlesToLinks(): Promise<{ updated: number }> {
  const result = await prisma.article.updateMany({
    where: {
      sourceUrl: { not: null },
      OR: [{ pdfKey: { not: null } }, { contentUrl: { not: null } }],
    },
    data: {
      pdfKey: null,
      contentUrl: null,
    },
  });
  logger.info("preloaded.migrate_links", { updated: result.count });
  return { updated: result.count };
}
