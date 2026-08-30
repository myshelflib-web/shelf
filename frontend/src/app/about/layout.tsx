import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Shelf (myshelflib) — My Shelf Lib study library",
  description:
    "About Shelf — also known as My Shelf Lib / myshelflib. A personal study workspace: upload PDFs, highlight notes, ask Study AI from your material, and plan work for any goal.",
  keywords: [
    "about Shelf",
    "myshelflib",
    "my shelf lib",
    "my shelf",
    "shel",
    "sheld",
    "shelflib",
    "myshelf",
    "Shelf library",
    "personal PDF library",
    "Study AI for students",
    "private study notes app",
  ],
  path: "/about",
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
