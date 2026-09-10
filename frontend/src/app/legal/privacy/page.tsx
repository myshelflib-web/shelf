import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { PRIVACY_POLICY } from "@/lib/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Privacy Policy — Shelf",
  description:
    "How Shelf collects, uses, and protects account, library, and Study AI data. Your privacy rights and contact details.",
  path: "/legal/privacy",
  absoluteTitle: true,
  keywords: [
    "Shelf privacy policy",
    "myshelflib privacy",
    "study library data protection",
  ],
});

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage doc={PRIVACY_POLICY} />;
}
