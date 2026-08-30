import { getSiteUrl } from "@/lib/siteUrl";

type Crumb = { name: string; path: string };

type LearnBreadcrumbJsonLdProps = {
  crumbs: Crumb[];
};

export function LearnBreadcrumbJsonLd({ crumbs }: LearnBreadcrumbJsonLdProps) {
  if (crumbs.length === 0) return null;

  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteUrl}${crumb.path}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
