import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchLearnTopic } from "@/lib/seo/learnFetch";

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
  const description =
    data.description?.trim() ||
    `${data.title} — free ${subjectName} study topics on Shelf Learn. Read articles and PDFs without signing in.`;

  return buildPageMetadata({
    title: `${data.title} — ${subjectName} | Shelf Learn`,
    description: description.slice(0, 160),
    path: `/learn/${subject}/${topic}`,
    keywords: [data.title, subjectName, "free study topics", "Shelf Learn"],
  });
}

export default function LearnTopicLayout({ children }: LayoutProps) {
  return children;
}
