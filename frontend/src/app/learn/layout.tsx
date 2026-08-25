import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LEARN_DESCRIPTION } from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: "Free UPSC syllabus & NCERT study library",
  description: LEARN_DESCRIPTION,
  path: "/learn",
  keywords: [
    "UPSC syllabus",
    "free UPSC notes",
    "NCERT PDF",
    "UPSC previous year papers",
    "IAS study material",
    "UPSC preparation free",
    "civil services syllabus",
    "Constitution notes UPSC",
    "Economic Survey UPSC",
    "free exam curriculum",
  ],
});

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
