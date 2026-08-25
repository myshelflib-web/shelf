import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Study library — Shelf",
  description:
    "Free UPSC and exam curriculum: syllabus, NCERT, Constitution, Economic Survey, and previous year papers. Read without signing up.",
  openGraph: {
    title: "Study library — Shelf",
    description:
      "Browse free exam curriculum packs. Sign in for a personal library and Study AI.",
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
