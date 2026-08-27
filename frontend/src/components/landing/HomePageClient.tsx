"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { LandingFeatureGrid } from "@/components/LandingFeatureGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingHeroMockup } from "@/components/landing/LandingHeroMockup";
import { LandingShowcases } from "@/components/landing/LandingShowcases";
import { BlogPreviewSection } from "@/components/blog/BlogPreviewSection";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Sparkles } from "lucide-react";
import { ThinkingIndicator } from "@/components/GreetingAccent";

export function HomePageClient() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/my-content");
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-y-auto">
        <section className="relative px-4 sm:px-6 pt-14 sm:pt-20 pb-6 max-w-6xl mx-auto overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <RevealOnScroll>
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-[3.25rem] font-bold mb-5 tracking-tight">
                <span className="block leading-[1.2] sm:leading-[1.15]">
                  Your personal study library
                </span>
                <span className="block mt-2 sm:mt-3 leading-[1.2] text-[var(--accent)]">
                  for any material you own
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-secondary)] mb-8 leading-relaxed">
                Upload PDFs and notes, highlight as you read, ask Study AI from
                your files, and plan work on one calm calendar — for college,
                exams, research, or professional reading.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/learn" className="btn-primary">
                  Browse free library
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="btn-secondary">
                  Create your library
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={120}>
            <LandingHeroMockup />
          </RevealOnScroll>
        </section>

        <LandingShowcases />

        <BlogPreviewSection />

        <section className="px-4 sm:px-6 py-6">
          <div className="max-w-6xl mx-auto landing-showcase text-center py-12 sm:py-16">
            <RevealOnScroll>
              <Sparkles className="w-6 h-6 text-[var(--accent)] mx-auto mb-4 greeting-sparkle" />
              <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                Built for focused reading and study
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto leading-relaxed">
                Free curriculum packs are open to everyone. Sign in for your
                own PDF library, highlights, planner, and Study AI grounded in
                what you uploaded.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/learn" className="btn-secondary">
                  Browse free study material
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/login" className="btn-primary">
                  Start free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <LandingFeatureGrid title="Everything at a glance" />
      </main>

      <MarketingFooter />
    </div>
  );
}
