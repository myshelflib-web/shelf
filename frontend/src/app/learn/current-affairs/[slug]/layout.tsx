import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { fetchCurrentAffairsItem } from "@/lib/seo/currentAffairsFetch";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const item = await fetchCurrentAffairsItem(slug);
  if (!item) {
    return buildPageMetadata({
      title: "Current affairs | Shelf Learn",
      description: "Exam-track current affairs digest from official sources.",
      path: `/learn/current-affairs/${slug}`,
      noIndex: true,
    });
  }

  const description =
    item.shelfSummary?.slice(0, 155) ??
    item.factualExcerpt?.slice(0, 155) ??
    `${item.title} — ${item.source.name}. Shelf summary with link to official source.`;

  return buildPageMetadata({
    title: `${item.title} | Current affairs | Shelf Learn`,
    description,
    path: item.sharePath,
    keywords: [
      "current affairs",
      item.source.name,
      ...item.studyGoals,
      ...item.tags.slice(0, 5),
    ],
  });
}

export default function CurrentAffairsItemLayout({ children }: LayoutProps) {
  return children;
}
