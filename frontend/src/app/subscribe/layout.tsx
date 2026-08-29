import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free & Premium plans",
  description:
    "Start free with your private study library — PDFs, highlights, Study AI, quiz, and planner. Upgrade to Premium for expanded library space, deeper AI, and advanced answer modes. Pay with Razorpay UPI.",
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
