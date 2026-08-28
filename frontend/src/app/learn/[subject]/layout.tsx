import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchLearnSubject } from "@/lib/seo/learnFetch";

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

  const description =
    subject.description?.trim() ||
    `Free ${subject.name} study material on Shelf Learn — syllabus articles, topic guides, and PDF readings. Browse without sign-in.`;

  return buildPageMetadata({
    title: `${subject.name} — Free study curriculum | Shelf Learn`,
    description: description.slice(0, 160),
    path: `/learn/${slug}`,
    keywords: [
      subject.name,
      "free study material",
      "exam syllabus",
      "Shelf Learn",
      "curriculum articles",
    ],
  });
}

export default function LearnSubjectLayout({ children }: LayoutProps) {
  return children;
}
