import type { Metadata } from "next";
import { LearnArticleJsonLd } from "@/components/seo/LearnArticleJsonLd";
import { LearnArticleSeoIntro } from "@/components/seo/LearnArticleSeoIntro";
import { LearnBreadcrumbJsonLd } from "@/components/seo/LearnBreadcrumbJsonLd";
import { buildArticlePageMetadata } from "@/lib/seo/metadata";
import {
  fetchLearnArticle,
  fetchLearnTopic,
  learnArticleSeoDescription,
} from "@/lib/seo/learnFetch";
import {
  learnArticleDescription,
  learnPageKeywords,
} from "@/lib/seo/learnTrackSeo";
import { isStudyGoal } from "@/lib/studyGoal";

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
  const goal = isStudyGoal(topicData?.subject?.studyGoal)
    ? topicData.subject.studyGoal
    : null;

  const description =
    learnArticleSeoDescription(articleData, topicTitle, subjectName) ||
    learnArticleDescription(articleTitle, topicTitle, subjectName, goal);

  return buildArticlePageMetadata({
    title: `${articleTitle} — ${topicTitle} | Shelf Learn`,
    description,
    path: `/learn/${subject}/${topic}/${article}`,
    modifiedTime: articleData?.updatedAt ?? undefined,
    keywords: learnPageKeywords(
      goal,
      articleTitle,
      topicTitle,
      subjectName,
      articleData?.sourceUrl ? "official study resource" : "free study PDF"
    ),
  });
}

export default async function LearnArticleLayout({
  children,
  params,
}: LayoutProps) {
  const { subject, topic, article } = await params;
  const [articleData, topicData] = await Promise.all([
    fetchLearnArticle(subject, topic, article),
    fetchLearnTopic(subject, topic),
  ]);

  const subjectName = topicData?.subject?.name ?? subject;
  const topicTitle = topicData?.title ?? topic;
  const articleTitle = articleData?.title ?? article;
  const goal = isStudyGoal(topicData?.subject?.studyGoal)
    ? topicData.subject.studyGoal
    : null;
  const description =
    learnArticleSeoDescription(articleData, topicTitle, subjectName) ||
    learnArticleDescription(articleTitle, topicTitle, subjectName, goal);
  const isPdf = Boolean(
    articleData?.hasPdf ||
      (articleData?.sourceUrl && /\.pdf($|\?|#)/i.test(articleData.sourceUrl))
  );

  return (
    <>
      <LearnBreadcrumbJsonLd
        crumbs={[
          { name: "Learn", path: "/learn" },
          { name: subjectName, path: `/learn/${subject}` },
          { name: topicTitle, path: `/learn/${subject}/${topic}` },
          {
            name: articleTitle,
            path: `/learn/${subject}/${topic}/${article}`,
          },
        ]}
      />
      <LearnArticleJsonLd
        title={articleTitle}
        description={description}
        path={`/learn/${subject}/${topic}/${article}`}
        subjectName={subjectName}
        topicName={topicTitle}
        studyGoal={goal}
        dateModified={articleData?.updatedAt ?? null}
        sourceUrl={articleData?.sourceUrl ?? null}
        isPdf={isPdf}
      />
      <LearnArticleSeoIntro
        subjectName={subjectName}
        subjectSlug={subject}
        topicTitle={topicTitle}
        topicSlug={topic}
        articleTitle={articleTitle}
        description={description}
      />
      {children}
    </>
  );
}
