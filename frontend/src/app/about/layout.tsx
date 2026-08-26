import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Shelf — Personal study library for serious reading",
  description:
    "Shelf is a personal study workspace for any goal. Upload PDFs, highlight notes, ask Study AI from your material, and plan work — used by students, researchers, teachers, and professionals.",
  path: "/about",
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
