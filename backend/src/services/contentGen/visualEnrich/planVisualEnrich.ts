import type { StudyGoal } from "@prisma/client";
import prisma from "../../../utils/prisma.js";
import { publicLearnSubjectWhere } from "../publicLearnSubject.js";

export type VisualEnrichPlanEntry = {
  articleId: string;
  subjectSlug: string;
  topicSlug: string;
  slug: string;
  title: string;
  contentUrl: string;
};

export async function planVisualEnrichArticles(input: {
  studyGoal: StudyGoal;
  subjectSlug?: string;
  limit?: number;
}): Promise<VisualEnrichPlanEntry[]> {
  const subjects = await prisma.subject.findMany({
    where: {
      AND: [
        publicLearnSubjectWhere(),
        { studyGoal: input.studyGoal },
        input.subjectSlug ? { slug: input.subjectSlug } : {},
      ],
    },
    select: {
      slug: true,
      topics: {
        select: {
          slug: true,
          articles: {
            where: {
              status: "PUBLISHED",
              contentUrl: { not: null },
            },
            orderBy: { order: "asc" },
            select: {
              id: true,
              slug: true,
              title: true,
              contentUrl: true,
            },
          },
        },
      },
    },
  });

  const entries: VisualEnrichPlanEntry[] = [];
  for (const subject of subjects) {
    for (const topic of subject.topics) {
      for (const article of topic.articles) {
        if (!article.contentUrl) continue;
        entries.push({
          articleId: article.id,
          subjectSlug: subject.slug,
          topicSlug: topic.slug,
          slug: article.slug,
          title: article.title,
          contentUrl: article.contentUrl,
        });
      }
    }
  }

  if (input.limit && input.limit > 0) {
    return entries.slice(0, input.limit);
  }
  return entries;
}
