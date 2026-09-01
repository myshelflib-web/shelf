import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  title: "Copyright & takedown",
  description:
    "How Shelf handles official Learn content, user uploads, and copyright complaints under Indian law.",
};

export default function CopyrightLegalPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-16 sm:py-20 max-w-3xl mx-auto w-full">
        <RevealOnScroll>
          <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
            Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">
            Copyright &amp; takedown
          </h1>
          <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
            Shelf aggregates official study links and hosts your private library.
            This page explains what we publish, what we do not copy, and how to
            report infringement.
          </p>
        </RevealOnScroll>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Learn &amp; Explore (public catalog)
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Most entries are <strong>links only</strong> — we do not host
                full newspaper or commercial textbook text.
              </li>
              <li>
                Government press items show a short excerpt (≤280 characters) from
                the official RSS feed plus a link to the publisher.
              </li>
              <li>
                Official documents (e.g. NCERT PDFs, Union Budget) may be shown
                via an official link, a temporary proxy, or a mirrored copy on
                Shelf when embedding fails. Each PDF view shows the{" "}
                <strong>official source and link</strong>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Your uploads (<code className="text-xs">/my-content</code>)
            </h2>
            <p>
              Files you upload stay in your private library. By uploading, you
              confirm that you have the right to store and study that material
              (your own notes, legally purchased books, or other content you are
              permitted to use). Do not upload pirated PDFs, scanned books you do
              not own, or material that infringes someone else&apos;s copyright.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Notice &amp; takedown (India)
            </h2>
            <p className="mb-3">
              If you believe content on Shelf infringes your copyright, send a
              notice with:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>Your name and contact email</li>
              <li>Identification of the copyrighted work</li>
              <li>The exact Shelf URL where the material appears</li>
              <li>A statement that you have a good-faith belief the use is not authorized</li>
              <li>A statement that the information is accurate and you are authorized to act</li>
            </ol>
            <p>
              Email{" "}
              <a
                href="mailto:hello@shelf.study?subject=Copyright%20takedown%20notice"
                className="text-[var(--accent)] hover:underline"
              >
                hello@shelf.study
              </a>{" "}
              with subject line &quot;Copyright takedown notice&quot;. We review
              valid notices and remove or disable access to disputed material
              where appropriate, consistent with intermediary guidelines under
              the Information Technology Act, 2000 and related rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
              Counter-notice
            </h2>
            <p>
              If your content was removed in error, reply to our takedown email
              with your contact details, the removed URL, and a statement under
              penalty of perjury that the material was removed by mistake or
              misidentification.
            </p>
          </section>

          <p className="text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)]">
            Last updated: September 2026. For general questions see{" "}
            <Link href="/contact" className="text-[var(--accent)] hover:underline">
              Contact
            </Link>
            .
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
