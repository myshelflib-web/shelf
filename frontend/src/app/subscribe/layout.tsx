import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free & Premium plans",
  description:
    "Shelf plans: free personal study library (100 MB), or Premium for 1 GB storage, 1M Study AI tokens/month, Standard & Deep modes, and deeper indexing. Pay with Razorpay UPI.",
  path: "/subscribe",
  keywords: [
    "Shelf Premium",
    "study app pricing India",
    "AI study subscription",
    "PDF library premium",
    "UPSC study app cost",
    "Razorpay UPI study app",
  ],
});

export default function SubscribeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
