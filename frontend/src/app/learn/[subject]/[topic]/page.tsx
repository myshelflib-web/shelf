import { Suspense } from "react";
import {
  LearnBrowseShellFallback,
} from "@/components/learn/LearnBrowseWorkspace";
import { LearnCatalogSeoIntro } from "@/components/seo/LearnCatalogSeoIntro";
import { LearnSeoMain, LearnSeoShell } from "@/components/seo/LearnSeoShell";
import { fetchLearnTopic } from "@/lib/seo/learnFetch";
import { learnTopicDescription } from "@/lib/seo/learnTrackSeo";
import { isStudyGoal } from "@/lib/studyGoal";
import { TopicBrowseClient } from "./TopicBrowseClient";

type PageProps = {
  params: Promise<{ subject: string; topic: string }>;
};

export default async function TopicPage({ params }: PageProps) {
  const { subject, topic } = await params;
  const data = await fetchLearnTopic(subject, topic);

  if (!data) {
    return (
      <Suspense fallback={<LearnBrowseShellFallback />}>
        <TopicBrowseClient />
      </Suspense>
    );
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
  const articleLinks = (data.articles ?? []).map((a) => ({
    name: a.title,
    href: `/learn/${subject}/${topic}/${a.slug}`,
  }));

  return (
    <LearnSeoShell>
      <LearnCatalogSeoIntro
        title={data.title}
        description={description}
        crumbs={[
          { name: "Learn", href: "/learn" },
          { name: subjectName, href: `/learn/${subject}` },
          { name: data.title },
        ]}
        childrenLinks={articleLinks}
        childrenLabel="Articles"
      />
      <LearnSeoMain>
        <Suspense fallback={<LearnBrowseShellFallback />}>
          <TopicBrowseClient />
        </Suspense>
      </LearnSeoMain>
    </LearnSeoShell>
  );
}
