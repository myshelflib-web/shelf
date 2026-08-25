import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Shelf — Support for your study library",
  description:
    "Questions about Shelf, UPSC curriculum, PDF uploads, Study AI, or Premium? Contact the Shelf team for help with your personal study library.",
  path: "/contact",
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
