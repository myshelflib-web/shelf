"use client";

import { LearnReaderWorkspace } from "@/components/learn/LearnReaderWorkspace";
import { PreloadedBrowseProvider } from "@/components/learn/PreloadedBrowseContext";
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
    <PreloadedBrowseProvider>
      <LearnReaderWorkspace
        scope={learnScope(subjectSlug, topicSlug, articleSlug)}
      />
    </PreloadedBrowseProvider>
  );
}
