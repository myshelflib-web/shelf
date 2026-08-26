import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { QUIZ_DESCRIPTION, QUIZ_KEYWORDS, QUIZ_TITLE } from "@/lib/seo/keywords";

export const metadata: Metadata = buildPageMetadata({
  title: QUIZ_TITLE,
  description: QUIZ_DESCRIPTION,
  path: "/quiz",
  keywords: QUIZ_KEYWORDS,
});

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
