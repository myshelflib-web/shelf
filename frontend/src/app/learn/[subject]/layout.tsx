import type { Metadata } from "next";
import { LearnBreadcrumbJsonLd } from "@/components/seo/LearnBreadcrumbJsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchLearnSubject } from "@/lib/seo/learnFetch";
import {
  learnPageKeywords,
  learnSubjectDescription,
} from "@/lib/seo/learnTrackSeo";
import { isStudyGoal } from "@/lib/studyGoal";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ subject: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = await fetchLearnSubject(slug);
  if (!subject) {
    return buildPageMetadata({
      title: "Study subject — Shelf Learn",
      description: "Free curriculum articles and topic guides on Shelf Learn.",
      path: `/learn/${slug}`,
    });
  }

  const description = learnSubjectDescription(
    subject.name,
    isStudyGoal(subject.studyGoal) ? subject.studyGoal : null,
    subject.description
  );

  return buildPageMetadata({
    title: `${subject.name} — Free study curriculum | Shelf Learn`,
    description,
    path: `/learn/${slug}`,
    absoluteTitle: true,
    keywords: learnPageKeywords(
      isStudyGoal(subject.studyGoal) ? subject.studyGoal : null,
      subject.name,
      "free study material",
      "exam syllabus",
      "curriculum articles"
    ),
  });
}

export default async function LearnSubjectLayout({
  children,
  params,
}: LayoutProps) {
  const { subject: slug } = await params;
  const subject = await fetchLearnSubject(slug);

  if (!subject) return children;

  return (
    <>
      <LearnBreadcrumbJsonLd
        crumbs={[
          { name: "Learn", path: "/learn" },
          { name: subject.name, path: `/learn/${slug}` },
        ]}
      />
      {children}
    </>
  );
}
