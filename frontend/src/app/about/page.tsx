import Link from "next/link";
import { Header } from "@/components/Header";
import { LandingFeatureGrid } from "@/components/LandingFeatureGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { BrandSeoSignals } from "@/components/seo/BrandSeoSignals";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <BrandSeoSignals />
        <section className="relative px-4 sm:px-6 py-16 sm:py-24 max-w-3xl mx-auto text-center overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <RevealOnScroll>
            <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
              About Shelf
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
              A quiet library built for{" "}
              <span className="text-[var(--accent)]">serious study</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Shelf is a personal study workspace — not a content catalog. Upload
              your own PDFs and notes, highlight as you read, ask Study AI from
              your material, and keep tasks on one calendar.
            </p>
          </RevealOnScroll>
        </section>

        <section className="px-4 sm:px-6 pb-16 max-w-3xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Your material",
                body: "Everything you add stays private to your account. Organize pages into sections you control.",
              },
              {
                title: "Study AI on demand",
                body: "Ask questions on a highlight or the full page. Summaries, notes, and mind maps from what you uploaded.",
              },
              {
                title: "One calm dashboard",
                body: "After you sign in, your calendar, library, pinned pages, and Study AI live in one profile.",
              },
            ].map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 80}>
                <div className="feature-card p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] h-full">
                  <h2 className="font-semibold mb-2">{item.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.body}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <LandingFeatureGrid title="What Shelf includes" />

        <section className="px-4 sm:px-6 pb-20 max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className="text-2xl font-semibold mb-3">Ready to build your library?</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Sign in to upload content, pin favorites, chat with Study AI, and plan on
              your calendar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="btn-primary">
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/subscribe" className="btn-secondary">
                View plans
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
