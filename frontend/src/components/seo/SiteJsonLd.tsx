import { getSiteUrl } from "@/lib/siteUrl";
import { SOCIAL_SAME_AS } from "@/lib/socialLinks";
import { PRODUCT_INTENT_CLUSTERS } from "@/lib/seo/intentCoverage";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/icons/favicon-192.png`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shelf",
    alternateName: "myshelflib",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 192,
      height: 192,
    },
    image: `${siteUrl}/icons/shelf-icon-2048.png`,
    description:
      "Personal study library with PDF highlights, YouTube lectures, Study AI, and a planner — for students, professionals, researchers, and lifelong learners.",
    sameAs: SOCIAL_SAME_AS,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shelf",
    alternateName: "myshelflib.com",
    url: siteUrl,
    description:
      "Upload PDFs, bring in YouTube lectures, highlight as you read, ask Study AI from your material, and plan work on one calendar. Optional free curriculum packs included.",
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: "Shelf",
      logo: {
        "@type": "ImageObject",
        url: logoUrl,
      },
    },
    hasPart: [
      {
        "@type": "WebPage",
        name: "Features",
        url: `${siteUrl}/features`,
      },
      {
        "@type": "WebPage",
        name: "Blog",
        url: `${siteUrl}/blog`,
      },
      {
        "@type": "WebPage",
        name: "Pricing",
        url: `${siteUrl}/subscribe`,
      },
      {
        "@type": "WebPage",
        name: "Learn",
        url: `${siteUrl}/learn`,
      },
      {
        "@type": "WebPage",
        name: "About",
        url: `${siteUrl}/about`,
      },
      {
        "@type": "WebPage",
        name: "Exam-style quiz",
        url: `${siteUrl}/quiz`,
      },
      {
        "@type": "WebPage",
        name: "Sign in",
        url: `${siteUrl}/login`,
      },
    ],
  };

  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Shelf",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    description:
      "Personal study library app: PDF reader with highlights, AI study assistant grounded in your notes, Share Shelf, study planner, and optional free curriculum on Learn.",
    url: siteUrl,
    featureList: PRODUCT_INTENT_CLUSTERS.map((c) => c.label),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
    </>
  );
}
