import type { Metadata } from "next";
import { CurrentAffairsItemJsonLd } from "@/components/seo/CurrentAffairsItemJsonLd";
import { LearnBreadcrumbJsonLd } from "@/components/seo/LearnBreadcrumbJsonLd";
import { buildArticlePageMetadata } from "@/lib/seo/metadata";
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
    return buildArticlePageMetadata({
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

  const canonicalPath = item.learnPath ?? item.sharePath;

  return buildArticlePageMetadata({
    title: `${item.title} | Current affairs | Shelf Learn`,
    description,
    path: canonicalPath,
    publishedTime: item.publishedAtShelf ?? item.publishedAt ?? undefined,
    keywords: [
      "current affairs",
      item.source.name,
      ...item.studyGoals,
      ...item.tags.slice(0, 5),
    ],
  });
}

export default async function CurrentAffairsItemLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;
  const item = await fetchCurrentAffairsItem(slug);
  if (!item) return children;

  return (
    <>
      <LearnBreadcrumbJsonLd
        crumbs={[
          { name: "Learn", path: "/learn" },
          { name: "Current affairs", path: "/learn/current-affairs" },
          { name: item.title, path: item.sharePath },
        ]}
      />
      <CurrentAffairsItemJsonLd item={item} />
      {children}
    </>
  );
}
