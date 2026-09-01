import type { Metadata } from "next";
import { LearnNavigationProvider } from "@/components/learn/LearnNavigationProvider";
import { LearnHubJsonLd } from "@/components/seo/LearnHubJsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { LEARN_DESCRIPTION } from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: "Free study curriculum library | Shelf Learn",
  description: LEARN_DESCRIPTION,
  path: "/learn",
  absoluteTitle: true,
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
  return (
    <LearnNavigationProvider>
      <LearnHubJsonLd />
      {children}
    </LearnNavigationProvider>
  );
}
