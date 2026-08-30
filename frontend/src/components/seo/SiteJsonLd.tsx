import { getSiteUrl } from "@/lib/siteUrl";
import { SOCIAL_SAME_AS } from "@/lib/socialLinks";
import { PRODUCT_INTENT_CLUSTERS } from "@/lib/seo/intentCoverage";
import {
  BRAND_ALTERNATE_NAMES,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/seo/brandIdentity";
import { BrandSeoSignals } from "@/components/seo/BrandSeoSignals";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}/icons/favicon-192.png`;

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: 192,
      height: 192,
    },
    image: `${siteUrl}/icons/shelf-icon-2048.png`,
    description: BRAND_TAGLINE,
    sameAs: SOCIAL_SAME_AS,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    url: siteUrl,
    description: BRAND_TAGLINE,
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      alternateName: [...BRAND_ALTERNATE_NAMES],
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
        name: "About Shelf",
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
    name: BRAND_NAME,
    alternateName: [...BRAND_ALTERNATE_NAMES],
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    description: BRAND_TAGLINE,
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
      <BrandSeoSignals />
    </>
  );
}
