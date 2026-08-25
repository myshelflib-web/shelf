import { getSiteUrl } from "@/lib/siteUrl";

export function SiteJsonLd() {
  const siteUrl = getSiteUrl();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shelf",
    url: siteUrl,
    logo: `${siteUrl}/icons/shelf-icon-2048.png`,
    description:
      "Personal study library for UPSC, IAS, and competitive exam preparation with PDF highlights and Study AI.",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Shelf",
    url: siteUrl,
    description:
      "Free UPSC syllabus and NCERT study material. Upload PDFs, highlight, ask Study AI, and plan revision.",
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: "Shelf",
    },
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
      "Personal study library app: PDF reader with highlights, AI study assistant from your notes, planner and free UPSC curriculum.",
    url: siteUrl,
    featureList: [
      "PDF highlights and annotations",
      "Study AI from uploaded PDFs",
      "UPSC syllabus and NCERT curriculum",
      "Study planner and calendar",
      "Cross-device reading sync",
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
