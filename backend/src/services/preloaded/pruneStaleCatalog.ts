import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { catalogSubjectSlugs } from "../contentGen/syllabus/index.js";
import { deleteAdminArticleStorage } from "./adminArticleStorage.js";

/**
 * Archives non-generated Learn articles and deletes their S3 objects (NCERT
 * PDFs, portal mirrors, leftover links). Generated HTML pages are left alone.
 * User library objects under users/ are not touched.
 */
export async function pruneStalePreloadedArticles(): Promise<{ archived: number }> {
  const keep = new Set(catalogSubjectSlugs());
  const subjects = await prisma.subject.findMany({
    select: {
      slug: true,
      topics: {
        select: {
          slug: true,
          articles: {
            where: { status: { in: ["PUBLISHED", "PROCESSING", "DRAFT"] } },
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
    if (keep.has(subject.slug) || subject.slug.startsWith("exam-briefs-")) {
      continue;
    }

    for (const topic of subject.topics) {
      for (const article of topic.articles) {
        const key = `${subject.slug}/${topic.slug}/${article.slug}`;
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
