import { siteNavigationJsonLd } from "@/lib/seo/siteNavigationSeo";

/** Crawl-only site nav graph — helps Google understand main sections for sitelinks. */
export function SiteNavigationJsonLd() {
  const data = siteNavigationJsonLd();
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
