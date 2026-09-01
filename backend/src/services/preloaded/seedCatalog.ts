import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { isStudyGoal } from "../../studyGoal.js";
import { ALL_PRELOADED_CATALOG } from "./catalogIndex.js";
import type { PreloadedCatalogEntry } from "./types.js";

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
}> {
  let created = 0;
  let updated = 0;

  for (const entry of ALL_PRELOADED_CATALOG) {
    const { topicId } = await upsertSubjectTopic(entry);

    const existing = await prisma.article.findUnique({
      where: { topicId_slug: { topicId, slug: entry.slug } },
      select: { id: true },
    });

    const articleData = {
      title: entry.title,
      sourceUrl: entry.sourceUrl,
      sourceLicense: entry.license,
      summary: entry.summary.slice(0, 500),
      contentUrl: null,
      pdfKey: null,
      status: "PUBLISHED" as const,
      order: entry.order ?? 0,
      linkStatus: "UNKNOWN" as const,
    };

    if (existing) {
      await prisma.article.update({
        where: { id: existing.id },
        data: articleData,
      });
      updated += 1;
    } else {
      await prisma.article.create({
        data: {
          topicId,
          slug: entry.slug,
          isPremium: false,
          ...articleData,
        },
      });
      created += 1;
    }
  }

  logger.info("preloaded.catalog.seeded", {
    created,
    updated,
    total: ALL_PRELOADED_CATALOG.length,
  });
  return { created, updated };
}
