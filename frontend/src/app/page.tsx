import type { Metadata } from "next";
import { HomePageClient } from "@/components/landing/HomePageClient";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { HomePageJsonLd } from "@/components/seo/HomePageJsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  HOME_DESCRIPTION,
  HOME_PAGE_KEYWORDS,
  HOME_TITLE,
} from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
  keywords: HOME_PAGE_KEYWORDS,
});

export default function HomePage() {
  return (
    <>
      <SiteJsonLd />
      <HomePageJsonLd />
      <HomePageClient />
    </>
  );
}
