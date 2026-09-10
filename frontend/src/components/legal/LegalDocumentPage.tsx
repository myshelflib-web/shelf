import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LegalDocumentBody } from "@/components/legal/LegalDocumentBody";
import type { LegalDocument } from "@/lib/legal";

export function LegalDocumentPage({ doc }: { doc: LegalDocument }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-16 sm:py-20 max-w-3xl mx-auto w-full">
        <RevealOnScroll>
          <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            {doc.title}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Effective {doc.effectiveDate} · Last updated {doc.lastUpdated}
          </p>
          <p className="mb-4 text-xs leading-relaxed rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-[var(--text-secondary)]">
            Interim document pending attorney review for your entity and
            jurisdictions. Thorough product coverage is included; this is not
            legal advice and does not guarantee regulatory compliance.
          </p>
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            {doc.intro}
          </p>
        </RevealOnScroll>

        <LegalDocumentBody doc={{ ...doc, intro: "" }} hideMeta />

        <p className="mt-12 text-sm text-[var(--text-muted)]">
          Also see{" "}
          {doc.id === "terms" ? (
            <Link href="/legal/privacy" className="text-[var(--accent)] hover:underline">
              Privacy Policy
            </Link>
          ) : (
            <Link href="/legal/terms" className="text-[var(--accent)] hover:underline">
              Terms of Service
            </Link>
          )}{" "}
          and{" "}
          <Link href="/legal/copyright" className="text-[var(--accent)] hover:underline">
            Copyright &amp; takedown
          </Link>
          .
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
