import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { TERMS_OF_SERVICE } from "@/lib/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Terms of Service — Shelf",
  description:
    "Terms of Service for Shelf (myshelflib): accounts, uploads, Study AI, subscriptions, liability, and acceptable use.",
  path: "/legal/terms",
  absoluteTitle: true,
  keywords: [
    "Shelf terms of service",
    "myshelflib terms",
    "study library terms",
  ],
});

export default function TermsOfServicePage() {
  return <LegalDocumentPage doc={TERMS_OF_SERVICE} />;
}
