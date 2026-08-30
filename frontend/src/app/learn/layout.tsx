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
    "GATE syllabus",
    "UPSC study material free",
    "State PCS TNPSC RPSC",
    "judiciary bare acts PDF",
    "NEET PG study material",
    "CA exam notes free",
    "open educational resources",
    "exam study material free",
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
