import { getSiteUrl } from "@/lib/siteUrl";

type LearnArticleJsonLdProps = {
  title: string;
  description: string;
  path: string;
  subjectName: string;
  topicName: string;
};

export function LearnArticleJsonLd({
  title,
  description,
  path,
  subjectName,
  topicName,
}: LearnArticleJsonLdProps) {
  const url = `${getSiteUrl()}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url,
    isPartOf: {
      "@type": "WebPage",
      name: `${topicName} — ${subjectName}`,
      isPartOf: {
        "@type": "WebSite",
        name: "Shelf Learn",
        url: `${getSiteUrl()}/learn`,
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Shelf",
      url: getSiteUrl(),
    },
    inLanguage: "en",
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
