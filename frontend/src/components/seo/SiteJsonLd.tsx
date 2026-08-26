import { getSiteUrl } from "@/lib/siteUrl";

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
      "Personal study library with PDF highlights, Study AI, and a planner — for students, professionals, researchers, and lifelong learners.",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shelf",
    alternateName: "myshelflib.com",
    url: siteUrl,
    description:
      "Upload PDFs, highlight as you read, ask Study AI from your material, and plan work on one calendar. Optional free curriculum packs included.",
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
      "Personal study library app: PDF reader with highlights, AI study assistant grounded in your notes, study planner, and optional free curriculum.",
    url: siteUrl,
    featureList: [
      "PDF highlights and annotations",
      "Study AI from uploaded PDFs",
      "Personal collections and topics",
      "Study planner and calendar",
      "Cross-device reading sync",
      "Exam-style quiz from your notes",
      "Optional free curriculum library",
    ],
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
