import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Shelf — Personal study library for serious exam prep",
  description:
    "Shelf is a personal study workspace for UPSC, IAS, and competitive exams. Upload PDFs, highlight notes, ask Study AI from your material, and plan revision — not a generic content feed.",
  path: "/about",
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
