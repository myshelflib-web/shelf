import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LEARN_DESCRIPTION } from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: "Free study curriculum library",
  description: LEARN_DESCRIPTION,
  path: "/learn",
  keywords: [
    "free study curriculum",
    "online syllabus library",
    "NCERT PDF",
    "exam study material free",
    "open educational resources",
    "textbook topic guides",
    "UPSC syllabus",
    "competitive exam notes",
    "browse study material online",
    "free learning library",
  ],
});

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
