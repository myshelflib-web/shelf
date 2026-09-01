import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { isStudyGoal } from "../../studyGoal.js";
import { checkArticleLink } from "./articleLinkHealth.js";
import { ALL_PRELOADED_CATALOG } from "./catalogIndex.js";
import type { PreloadedCatalogEntry } from "./types.js";
import { deleteAdminArticleStorage } from "./adminArticleStorage.js";
import { pruneStalePreloadedArticles } from "./pruneStaleCatalog.js";

async function upsertSubjectTopic(entry: PreloadedCatalogEntry) {
  const goal = isStudyGoal(entry.studyGoal) ? entry.studyGoal : "UPSC";

  const subject = await prisma.subject.upsert({
    where: { slug: entry.subjectSlug },
    create: {
      name: entry.subjectName,
      slug: entry.subjectSlug,
      studyGoal: goal,
      description: `${entry.subjectName} — official government and institutional sources on Shelf Learn.`,
      order: 0,
    },
    update: {
      name: entry.subjectName,
      studyGoal: goal,
    },
    select: { id: true },
  });

  const topic = await prisma.topic.upsert({
    where: { subjectId_slug: { subjectId: subject.id, slug: entry.topicSlug } },
    create: {
      subjectId: subject.id,
      title: entry.topicTitle,
      slug: entry.topicSlug,
      description: entry.topicTitle,
      order: 0,
    },
    update: { title: entry.topicTitle },
    select: { id: true },
  });

  return { topicId: topic.id };
}

export async function seedPreloadedCatalog(): Promise<{
  created: number;
  updated: number;
  pruned: number;
}> {
  let created = 0;
  let updated = 0;

  for (const entry of ALL_PRELOADED_CATALOG) {
    const { topicId } = await upsertSubjectTopic(entry);

    const existing = await prisma.article.findUnique({
      where: { topicId_slug: { topicId, slug: entry.slug } },
      select: { id: true, sourceUrl: true, pdfKey: true, contentUrl: true },
    });

    const sourceUrlChanged = Boolean(
      existing?.sourceUrl && existing.sourceUrl !== entry.sourceUrl
    );

    if (sourceUrlChanged && existing) {
      await deleteAdminArticleStorage({
        pdfKey: existing.pdfKey,
        contentUrl: existing.contentUrl,
      });
    }

    const articleData = {
      title: entry.title,
      sourceUrl: entry.sourceUrl,
      sourceLicense: entry.license,
      summary: entry.summary.slice(0, 500),
      contentUrl: sourceUrlChanged ? null : (existing?.contentUrl ?? null),
      pdfKey: sourceUrlChanged ? null : (existing?.pdfKey ?? null),
      status: "PUBLISHED" as const,
      order: entry.order ?? 0,
      linkStatus: "UNKNOWN" as const,
    };

    if (existing) {
      await prisma.article.update({
        where: { id: existing.id },
        data: articleData,
      });
      try {
        await checkArticleLink(existing.id);
      } catch (err) {
        logger.warn("preloaded.seed.link_check_failed", {
          slug: entry.slug,
          err: err instanceof Error ? err.message : String(err),
        });
      }
      updated += 1;
    } else {
      const createdArticle = await prisma.article.create({
        data: {
          topicId,
          slug: entry.slug,
          isPremium: false,
          ...articleData,
        },
        select: { id: true },
      });
      try {
        await checkArticleLink(createdArticle.id);
      } catch (err) {
        logger.warn("preloaded.seed.link_check_failed", {
          slug: entry.slug,
          err: err instanceof Error ? err.message : String(err),
        });
      }
      created += 1;
    }
  }

  const { archived: pruned } = await pruneStalePreloadedArticles();

  logger.info("preloaded.catalog.seeded", {
    created,
    updated,
    pruned,
    total: ALL_PRELOADED_CATALOG.length,
  });
  return { created, updated, pruned };
}
