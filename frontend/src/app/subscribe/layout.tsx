import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free & Premium plans",
  description:
    "Start free with your private study library. Upgrade to Premium when you're ready for more space, deeper Study AI, and daily exam workflows. Pay with Razorpay UPI Autopay.",
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
