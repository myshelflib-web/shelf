import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import {
  ALL_PRELOADED_CATALOG,
  PRELOADED_SUBJECT_SLUGS,
} from "./catalogIndex.js";
import { deleteAdminArticleStorage } from "./adminArticleStorage.js";

function catalogKey(subjectSlug: string, topicSlug: string, articleSlug: string): string {
  return `${subjectSlug}/${topicSlug}/${articleSlug}`;
}

export async function pruneStalePreloadedArticles(): Promise<{ archived: number }> {
  const catalogKeys = new Set(
    ALL_PRELOADED_CATALOG.map((e) => catalogKey(e.subjectSlug, e.topicSlug, e.slug))
  );

  const subjects = await prisma.subject.findMany({
    where: { slug: { in: PRELOADED_SUBJECT_SLUGS } },
    select: {
      slug: true,
      topics: {
        select: {
          slug: true,
          articles: {
            where: {
              status: { in: ["PUBLISHED", "PROCESSING", "DRAFT"] },
              sourceUrl: { not: null },
            },
            select: {
              id: true,
              slug: true,
              pdfKey: true,
              contentUrl: true,
            },
          },
        },
      },
    },
  });

  let archived = 0;

  for (const subject of subjects) {
    for (const topic of subject.topics) {
      for (const article of topic.articles) {
        const key = catalogKey(subject.slug, topic.slug, article.slug);
        if (catalogKeys.has(key)) continue;

        await deleteAdminArticleStorage({
          pdfKey: article.pdfKey,
          contentUrl: article.contentUrl,
        });

        await prisma.article.update({
          where: { id: article.id },
          data: {
            status: "ARCHIVED",
            archivedAt: new Date(),
            pdfKey: null,
            contentUrl: null,
          },
        });

        archived += 1;
        logger.info("preloaded.prune.archived", {
          articleId: article.id,
          key,
        });
      }
    }
  }

  if (archived > 0) {
    logger.info("preloaded.prune.ok", { archived });
  }
  return { archived };
}
