import type { Metadata } from "next";
import { LearnBreadcrumbJsonLd } from "@/components/seo/LearnBreadcrumbJsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchLearnTopic } from "@/lib/seo/learnFetch";
import {
  learnPageKeywords,
  learnTopicDescription,
} from "@/lib/seo/learnTrackSeo";
import { isStudyGoal } from "@/lib/studyGoal";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ subject: string; topic: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { subject, topic } = await params;
  const data = await fetchLearnTopic(subject, topic);
  if (!data) {
    return buildPageMetadata({
      title: "Study topic — Shelf Learn",
      description: "Free topic guides and articles on Shelf Learn.",
      path: `/learn/${subject}/${topic}`,
    });
  }

  const subjectName = data.subject?.name ?? subject;
  const goal = isStudyGoal(data.subject?.studyGoal)
    ? data.subject.studyGoal
    : null;
  const description = learnTopicDescription(
    data.title,
    subjectName,
    goal,
    data.description
  );

  return buildPageMetadata({
    title: `${data.title} — ${subjectName} | Shelf Learn`,
    description,
    path: `/learn/${subject}/${topic}`,
    absoluteTitle: true,
    keywords: learnPageKeywords(
      goal,
      data.title,
      subjectName,
      "free study topics"
    ),
  });
}

export default async function LearnTopicLayout({
  children,
  params,
}: LayoutProps) {
  const { subject, topic } = await params;
  const data = await fetchLearnTopic(subject, topic);
  if (!data) return children;

  const subjectName = data.subject?.name ?? subject;

  return (
    <>
      <LearnBreadcrumbJsonLd
        crumbs={[
          { name: "Learn", path: "/learn" },
          { name: subjectName, path: `/learn/${subject}` },
          { name: data.title, path: `/learn/${subject}/${topic}` },
        ]}
      />
      {children}
    </>
  );
}
