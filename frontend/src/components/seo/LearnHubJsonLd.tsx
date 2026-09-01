import { getSiteUrl } from "@/lib/siteUrl";
import { LEARN_DESCRIPTION } from "@/lib/seo/keywords";

export function LearnHubJsonLd() {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/learn`;

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Shelf Learn — free study curriculum",
    description: LEARN_DESCRIPTION,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "Shelf | myshelflib",
      url: siteUrl,
    },
    inLanguage: "en-IN",
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
