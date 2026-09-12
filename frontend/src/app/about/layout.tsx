import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Shelf — Store PDFs & Notes, Ask an LLM (myshelflib)",
  description:
    "About Shelf (myshelflib / My Shelf Lib): store PDFs and notes in one library, then ask Study AI — an LLM grounded in your uploads — with highlights, quizzes, and a planner.",
  keywords: [
    "about Shelf",
    "myshelflib",
    "store notes and PDFs",
    "ask LLM about PDFs",
    "my shelf lib",
    "Shelf library",
    "personal PDF library",
    "Study AI",
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
