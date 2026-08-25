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
      "Free UPSC syllabus & exam study material plus a personal PDF library. Highlights, Study AI on your notes, and a revision planner for serious prep.",
    keywords: DEFAULT_KEYWORDS,
    applicationName: "Shelf",
    authors: [{ name: "Shelf", url: siteUrl }],
    creator: "Shelf",
    openGraph: {
      siteName: "Shelf",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 2048,
          height: 2048,
          alt: "Shelf — personal study library for UPSC & competitive exams",
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
