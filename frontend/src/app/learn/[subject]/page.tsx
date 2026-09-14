import { Suspense } from "react";
import { LearnBrowseShellFallback } from "@/components/learn/LearnBrowseWorkspace";
import { LearnCatalogSeoIntro } from "@/components/seo/LearnCatalogSeoIntro";
import { LearnSeoMain, LearnSeoShell } from "@/components/seo/LearnSeoShell";
import { fetchLearnSubject } from "@/lib/seo/learnFetch";
import { learnSubjectDescription } from "@/lib/seo/learnTrackSeo";
import { isStudyGoal } from "@/lib/studyGoal";
import { SubjectBrowseClient } from "./SubjectBrowseClient";

type PageProps = {
  params: Promise<{ subject: string }>;
};

export default async function SubjectPage({ params }: PageProps) {
  const { subject: slug } = await params;
  const subject = await fetchLearnSubject(slug);

  if (!subject) {
    return (
      <Suspense fallback={<LearnBrowseShellFallback />}>
        <SubjectBrowseClient />
      </Suspense>
    );
  }

  const description = learnSubjectDescription(
    subject.name,
    isStudyGoal(subject.studyGoal) ? subject.studyGoal : null,
    subject.description
  );
  const topicLinks = (subject.topics ?? [])
    .filter((t) => (t.articles?.length ?? 0) > 0)
    .map((t) => ({
      name: t.title,
      href: `/learn/${slug}/${t.slug}`,
    }));

  return (
    <LearnSeoShell>
      <LearnCatalogSeoIntro
        title={subject.name}
        description={description}
        crumbs={[
          { name: "Learn", href: "/learn" },
          { name: subject.name },
        ]}
        childrenLinks={topicLinks}
        childrenLabel="Topics"
      />
      <LearnSeoMain>
        <Suspense fallback={<LearnBrowseShellFallback />}>
          <SubjectBrowseClient />
        </Suspense>
      </LearnSeoMain>
    </LearnSeoShell>
  );
}
