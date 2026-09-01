import type { StudyGoal } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { uploadToS3 } from "../s3.js";
import { adminDocPrefix, contentHtmlKey } from "../../utils/docPaths.js";

export type PublishInput = {
  studyGoal: StudyGoal;
  subjectSlug: string;
  subjectName: string;
  subjectDescription: string;
  topicSlug: string;
  topicTitle: string;
  slug: string;
  title: string;
  summary: string;
  html: string;
  text: string;
  order?: number;
};

function textKey(docPrefix: string): string {
  return `${docPrefix}/content.txt`;
}

async function upsertSubjectTopic(input: PublishInput): Promise<string> {
  const subject = await prisma.subject.upsert({
    where: { slug: input.subjectSlug },
    create: {
      name: input.subjectName,
      slug: input.subjectSlug,
      studyGoal: input.studyGoal,
      description: input.subjectDescription,
      order: 0,
    },
    update: { name: input.subjectName, studyGoal: input.studyGoal },
    select: { id: true },
  });

  const topic = await prisma.topic.upsert({
    where: { subjectId_slug: { subjectId: subject.id, slug: input.topicSlug } },
    create: {
      subjectId: subject.id,
      title: input.topicTitle,
      slug: input.topicSlug,
      description: input.topicTitle,
      order: 0,
    },
    update: { title: input.topicTitle },
    select: { id: true },
  });

  return topic.id;
}

/**
 * Writes the generated page to S3 (HTML for the reader, text as the source
 * artifact) and upserts the Article row. Generated subjects use their own
 * slugs, so the preloaded catalog prune never touches these rows.
 */
export async function publishGeneratedArticle(
  input: PublishInput
): Promise<{ articleId: string; contentUrl: string }> {
  const topicId = await upsertSubjectTopic(input);

  const prefix = adminDocPrefix(input.subjectSlug, input.topicSlug, input.slug);
  const contentUrl = contentHtmlKey(prefix);

  await uploadToS3(contentUrl, input.html, "text/html; charset=utf-8");
  await uploadToS3(textKey(prefix), input.text, "text/plain; charset=utf-8");

  const data = {
    title: input.title,
    contentUrl,
    summary: input.summary.slice(0, 500),
    status: "PUBLISHED" as const,
    order: input.order ?? 0,
    linkStatus: "UNKNOWN" as const,
  };

  const existing = await prisma.article.findUnique({
    where: { topicId_slug: { topicId, slug: input.slug } },
    select: { id: true },
  });

  const article = existing
    ? await prisma.article.update({
        where: { id: existing.id },
        data,
        select: { id: true },
      })
    : await prisma.article.create({
        data: { topicId, slug: input.slug, isPremium: false, ...data },
        select: { id: true },
      });

  logger.info("contentgen.article.published", {
    articleId: article.id,
    slug: input.slug,
    subjectSlug: input.subjectSlug,
    created: !existing,
  });

  return { articleId: article.id, contentUrl };
}
