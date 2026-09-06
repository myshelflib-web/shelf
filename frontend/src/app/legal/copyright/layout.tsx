import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Copyright & takedown — Shelf",
  description:
    "How Shelf handles official Learn content, user uploads, and copyright complaints under Indian law.",
  path: "/legal/copyright",
  absoluteTitle: true,
  keywords: [
    "Shelf copyright",
    "myshelflib takedown",
    "DMCA study library",
    "Learn catalog license",
  ],
});

export default function CopyrightLegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
