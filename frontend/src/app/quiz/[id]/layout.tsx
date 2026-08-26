import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Quiz attempt",
  description: "Private quiz attempt on Shelf. Sign in to continue a paper.",
  path: "/quiz",
  noIndex: true,
});

export default function QuizAttemptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
