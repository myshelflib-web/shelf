import { getSiteUrl } from "@/lib/siteUrl";
import type { ShelfFeature } from "@/lib/seo/featureTypes";
import { featurePagePath } from "@/lib/seo/featureCatalog";

export function FeatureJsonLd({ feature }: { feature: ShelfFeature }) {
  const siteUrl = getSiteUrl();
  const path = featurePagePath(feature);
  const url = `${siteUrl}${path}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Shelf",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Features",
        item: `${siteUrl}/features`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: feature.headline,
        item: url,
      },
    ],
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: feature.title,
    description: feature.metaDescription,
    url,
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      name: "Shelf",
      url: siteUrl,
    },
    about: {
      "@type": "SoftwareApplication",
      name: "Shelf",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }}
      />
    </>
  );
}

export function FeaturesHubJsonLd({
  features,
}: {
  features: Pick<ShelfFeature, "slug" | "headline" | "metaDescription">[];
}) {
  const siteUrl = getSiteUrl();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Shelf features",
    description:
      "PDF library, Study AI, Quiz, Telegram import, Spotify focus audio, document sharing, planner, and more.",
    url: `${siteUrl}/features`,
    numberOfItems: features.length,
    itemListElement: features.map((f, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: f.headline,
      url: `${siteUrl}/features/${f.slug}`,
      description: f.metaDescription,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
    />
  );
}
