"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { LandingFeatureGrid } from "@/components/LandingFeatureGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingShowcases } from "@/components/landing/LandingShowcases";
import { BlogPreviewSection } from "@/components/blog/BlogPreviewSection";
import { LandingProductPreview } from "@/components/landing/LandingProductPreview";
import { LandingValueSteps } from "@/components/landing/LandingValueSteps";
import { LandingGoalSection } from "@/components/landing/LandingGoalSection";
import { LandingCtaBanner } from "@/components/landing/LandingCtaBanner";
import { LandingQuizSection } from "@/components/landing/LandingQuizSection";
import { LandingIntegrationsSection } from "@/components/landing/LandingIntegrationsSection";
import { LandingLearnSection } from "@/components/landing/LandingLearnSection";
import { LandingGuestAccessSection } from "@/components/landing/LandingGuestAccessSection";
import { LandingHeroHighlights } from "@/components/landing/LandingHeroHighlights";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles } from "lucide-react";
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

      <main className="landing-page flex-1 min-h-0 overflow-y-auto">
        <section className="landing-hero" aria-labelledby="landing-hero-heading">
          <RevealOnScroll>
            <div>
              <div className="landing-eyebrow">Your personal study library</div>
              <h1 id="landing-hero-heading">
                Your material. One reader, Study AI, planner, and quiz.
              </h1>
              <p className="landing-lead">
                Upload PDFs, create sketch notebooks and typed doc pages, and keep
                everything in collections you control. Open multiple pages in tabs,
                split view two sources side by side, highlight as you read, ask Study
                AI from your files, and plan revision on a calendar.
              </p>
              <div className="landing-hero-actions">
                <Link href="/login" className="landing-btn landing-btn-primary">
                  Create your library
                </Link>
                <Link href="/learn" className="landing-btn">
                  Browse free library
                </Link>
              </div>
              <p className="landing-hero-note">
                <Link href="/learn">Learn guides</Link> are open without sign-in.
                Your private library starts when you create an account.
              </p>
              <LandingHeroHighlights />
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <LandingProductPreview />
          </RevealOnScroll>
        </section>

        <LandingValueSteps />

        <LandingShowcases />

        <LandingQuizSection />

        <LandingIntegrationsSection />

        <LandingLearnSection />

        <BlogPreviewSection variant="landing" />

        <section className="landing-mid-cta" aria-labelledby="landing-mid-cta-heading">
          <div className="landing-mid-cta-inner">
            <RevealOnScroll>
              <Sparkles className="w-6 h-6 text-[var(--accent)] mx-auto mb-4" />
              <h2 id="landing-mid-cta-heading">Built for focused reading and study</h2>
              <p>
                Free curriculum packs are open to everyone on Learn. Sign in for
                your own PDF library, highlights, planner, Study AI grounded in
                what you uploaded, Telegram import, Spotify focus audio, and
                exam-style quiz from your notes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/learn" className="landing-btn">
                  Browse free study material
                </Link>
                <Link href="/login" className="landing-btn landing-btn-primary">
                  Start free
                </Link>
              </div>
            </RevealOnScroll>
          </div>
        </section>

        <LandingFeatureGrid title="Everything at a glance" variant="landing" />

        <LandingGuestAccessSection />

        <section className="landing-features-link">
          <Link href="/features">
            See all features — reader workspace, sharing, offline PWA, Premium &amp; more →
          </Link>
        </section>

        <LandingGoalSection />

        <LandingCtaBanner
          title="Start with your material. Shape Shelf around your workflow."
          copy="Use it for learning, research, exam prep, professional reading, or anything else you keep building over time."
        />

        <MarketingFooter variant="landing" />
      </main>
    </div>
  );
}
