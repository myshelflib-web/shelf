import { LearnArticlePageClient } from "@/components/learn/LearnArticlePageClient";

type PageProps = {
  params: Promise<{ subject: string; topic: string; article: string }>;
};

export default async function ArticlePage({ params }: PageProps) {
  const { subject, topic, article } = await params;

  return (
    <LearnArticlePageClient
      subjectSlug={subject}
      topicSlug={topic}
      articleSlug={article}
    />
  );
}
