import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchLearnArticle, fetchLearnTopic } from "@/lib/seo/learnFetch";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ subject: string; topic: string; article: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { subject, topic, article } = await params;
  const [articleData, topicData] = await Promise.all([
    fetchLearnArticle(subject, topic, article),
    fetchLearnTopic(subject, topic),
  ]);

  const subjectName = topicData?.subject?.name ?? subject;
  const topicTitle = topicData?.title ?? topic;
  const articleTitle = articleData?.title ?? article;

  const description = `Read ${articleTitle} — ${topicTitle} in ${subjectName} on Shelf Learn. Free curriculum article with reader highlights when signed in.`;

  return buildPageMetadata({
    title: `${articleTitle} — ${topicTitle} | Shelf Learn`,
    description: description.slice(0, 160),
    path: `/learn/${subject}/${topic}/${article}`,
    keywords: [articleTitle, topicTitle, subjectName, "free study article"],
  });
}

export default function LearnArticleLayout({ children }: LayoutProps) {
  return children;
}
