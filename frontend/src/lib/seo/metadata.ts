import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/siteUrl";
import { DEFAULT_KEYWORDS } from "./keywords";

const OG_IMAGE = "/icons/shelf-icon-2048.png";

type PageMetaInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = "",
  keywords = DEFAULT_KEYWORDS,
  noIndex = false,
}: PageMetaInput): Metadata {
  const siteUrl = getSiteUrl();
  const canonical = path
    ? `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
    : siteUrl;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Shelf",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 2048,
          height: 2048,
          alt: "Shelf — personal study library",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

export function rootLayoutMetadata(): Metadata {
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: "Shelf — Your study library",
      template: "%s · Shelf",
    },
    description:
      "Personal PDF study library with highlights, Study AI on your notes, a revision planner, and optional free curriculum — for any subject or goal.",
    keywords: DEFAULT_KEYWORDS,
    applicationName: "Shelf",
    authors: [{ name: "Shelf", url: siteUrl }],
    creator: "Shelf",
    // Google SERP favicon: square PNG, multiple of 48px (SVG often ignored).
    icons: {
      icon: [
        { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/icons/favicon-96.png", sizes: "96x96", type: "image/png" },
        { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
      shortcut: ["/icons/favicon-48.png"],
    },
    openGraph: {
      siteName: "Shelf",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 2048,
          height: 2048,
          alt: "Shelf — personal study library for PDFs, highlights, and Study AI",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@shelfstudy",
    },
    appleWebApp: {
      capable: true,
      title: "Shelf",
      statusBarStyle: "black-translucent",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "apple-mobile-web-app-capable": "yes",
    },
  };
}
