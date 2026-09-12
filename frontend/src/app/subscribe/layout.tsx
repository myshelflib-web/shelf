import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Pricing — Free Study AI & Quiz, Premium from ₹149/mo | Shelf",
  description:
    "Start free with library, Study AI, and quizzes. Upgrade to Premium (~₹149/mo or ~₹1299/yr, UPI) for more storage and deeper AI when Shelf becomes your daily study home.";
  path: "/subscribe",
  keywords: [
    "Shelf Premium",
    "study app pricing India",
    "affordable AI study app",
    "free Study AI plan",
    "AI study subscription",
    "PDF library premium",
    "Shelf vs alternatives pricing",
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
