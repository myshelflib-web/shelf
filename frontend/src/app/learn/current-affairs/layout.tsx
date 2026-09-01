import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Live current affairs | Shelf Learn",
  description:
    "Copyright-safe exam current affairs from PIB, PRS, and official sources. Shelf summaries with citeable share links and source embeds.",
  path: "/learn/current-affairs",
  keywords: [
    "current affairs",
    "UPSC current affairs",
    "PIB summary",
    "exam news",
    "Shelf Learn",
  ],
});

export default function CurrentAffairsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
