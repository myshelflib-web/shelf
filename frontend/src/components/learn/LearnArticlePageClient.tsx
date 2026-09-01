"use client";

import { LearnReaderWorkspace } from "@/components/learn/LearnReaderWorkspace";
import { learnScope } from "@/lib/learnContent";

export function LearnArticlePageClient({
  subjectSlug,
  topicSlug,
  articleSlug,
}: {
  subjectSlug: string;
  topicSlug: string;
  articleSlug: string;
}) {
  return (
    <LearnReaderWorkspace
      scope={learnScope(subjectSlug, topicSlug, articleSlug)}
    />
  );
}
