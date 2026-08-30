import { getSiteUrl } from "@/lib/siteUrl";
import { homeIntentFaqs, PRODUCT_INTENT_CLUSTERS } from "@/lib/seo/intentCoverage";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";

export function HomePageJsonLd() {
  const siteUrl = getSiteUrl();
  const faqs = homeIntentFaqs();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "What Shelf helps with",
    description:
      "Personal study library, Share Shelf, Study AI, exam quizzes, teacher lesson resources, and more.",
    numberOfItems: PRODUCT_INTENT_CLUSTERS.length,
    itemListElement: PRODUCT_INTENT_CLUSTERS.map((cluster, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: cluster.label,
      url: `${siteUrl}${cluster.path}`,
      description: cluster.answer,
    })),
  };

  return (
    <>
      <FaqJsonLd faqs={faqs} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
