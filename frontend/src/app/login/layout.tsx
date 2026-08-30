import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Sign in to Shelf",
  description:
    "Sign in to Shelf (myshelflib) — open your personal study library, highlights, Study AI, and planner.",
  path: "/login",
  keywords: ["sign in Shelf", "Shelf login", "myshelflib login", "my shelf lib"],
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
