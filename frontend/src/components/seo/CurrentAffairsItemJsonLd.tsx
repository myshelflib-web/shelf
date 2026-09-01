import { getSiteUrl } from "@/lib/siteUrl";
import type { CurrentAffairsPublicItem } from "@/lib/seo/currentAffairsFetch";

export function CurrentAffairsItemJsonLd({
  item,
}: {
  item: CurrentAffairsPublicItem;
}) {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${item.sharePath}`;
  const published =
    item.publishedAtShelf ?? item.publishedAt ?? new Date().toISOString();

  const json = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.shelfSummary ?? item.factualExcerpt ?? item.title,
    datePublished: published,
    dateModified: published,
    mainEntityOfPage: url,
    url,
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: item.source.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Shelf | myshelflib",
      url: siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
