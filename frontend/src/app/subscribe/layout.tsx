import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free & Premium plans",
  description:
    "Shelf plans: free personal study library, or Premium for more storage, Study AI tokens, and deeper indexing. Pay securely with Razorpay.",
  path: "/subscribe",
});

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
