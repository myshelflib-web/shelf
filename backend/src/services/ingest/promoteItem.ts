import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { slugify } from "../../utils/slugify.js";
import { isStudyGoal } from "../../studyGoal.js";

async function ensureSubjectTopic(
  subjectSlug: string,
  topicSlug: string,
  studyGoal: string
): Promise<{ topicId: string }> {
  const goal = isStudyGoal(studyGoal) ? studyGoal : "UPSC";

  const subject = await prisma.subject.upsert({
    where: { slug: subjectSlug },
    create: {
      name: subjectSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: subjectSlug,
      studyGoal: goal,
      order: 0,
    },
    update: {},
    select: { id: true },
  });

  const topic = await prisma.topic.upsert({
    where: { subjectId_slug: { subjectId: subject.id, slug: topicSlug } },
    create: {
      subjectId: subject.id,
      title: topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      slug: topicSlug,
      order: 0,
    },
    update: {},
    select: { id: true },
  });

  return { topicId: topic.id };
}

export async function promoteIngestItem(itemId: string): Promise<{ articleId: string | null }> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    include: { source: true, article: true },
  });
  if (!item) throw new Error("Ingest item not found.");
  if (item.articleId) return { articleId: item.articleId };

  const subjectSlug = item.source.promoteToSubjectSlug;
  const topicSlug = item.source.promoteToTopicSlug;
  if (!subjectSlug || !topicSlug) {
    await prisma.ingestItem.update({
      where: { id: itemId },
      data: { status: "APPROVED", publishedAtShelf: new Date() },
    });
    return { articleId: null };
  }

  const primaryGoal = item.studyGoals[0] ?? item.source.studyGoals[0] ?? "UPSC";
  const { topicId } = await ensureSubjectTopic(subjectSlug, topicSlug, primaryGoal);

  const baseSlug = slugify(`${item.title}-${item.edition ?? ""}`) || slugify(item.title) || "item";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.article.findUnique({ where: { topicId_slug: { topicId, slug } } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const embedUrl = item.sourcePdfUrl ?? item.canonicalUrl;
  const pdfKey = item.pdfKey;

  const article = await prisma.article.create({
    data: {
      topicId,
      title: item.title,
      slug,
      pdfKey,
      sourceUrl: embedUrl,
      sourceLicense: item.license,
      summary: item.shelfSummary?.slice(0, 500) ?? null,
      edition: item.edition,
      status: pdfKey ? "PROCESSING" : "PUBLISHED",
      contentUrl: null,
      order: 0,
      isPremium: false,
      linkStatus: "UNKNOWN",
    },
    select: { id: true },
  });

  await prisma.ingestItem.update({
    where: { id: itemId },
    data: {
      articleId: article.id,
      status: "PUBLISHED",
      publishedAtShelf: new Date(),
    },
  });

  logger.info("ingest.promote.ok", { itemId, articleId: article.id, slug });
  return { articleId: article.id };
}
