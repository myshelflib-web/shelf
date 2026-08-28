import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  FEATURES_HUB_DESCRIPTION,
  FEATURES_HUB_KEYWORDS,
  FEATURES_HUB_TITLE,
} from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: FEATURES_HUB_TITLE,
  description: FEATURES_HUB_DESCRIPTION,
  path: "/features",
  keywords: FEATURES_HUB_KEYWORDS,
});

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
