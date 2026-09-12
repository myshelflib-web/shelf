"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { LandingFeatureGrid } from "@/components/LandingFeatureGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingShowcases } from "@/components/landing/LandingShowcases";
import { LandingProductPreview } from "@/components/landing/LandingProductPreview";
import { LandingValueSteps } from "@/components/landing/LandingValueSteps";
import { LandingGoalSection } from "@/components/landing/LandingGoalSection";
import { LandingCtaBanner } from "@/components/landing/LandingCtaBanner";
import { LandingQuizSection } from "@/components/landing/LandingQuizSection";
import { LandingIntegrationsSection } from "@/components/landing/LandingIntegrationsSection";
import { LandingStickyCta } from "@/components/landing/LandingStickyCta";
import { useAuth } from "@/hooks/useAuth";
import {
  BookMarked,
  BookOpen,
  CalendarDays,
  FolderOpen,
  FolderPlus,
  Layers,
  ListChecks,
  NotebookPen,
  Sparkles,
} from "lucide-react";
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
        <section
          className="landing-hero"
          id="landing-hero"
          aria-labelledby="landing-hero-heading"
        >
          <div className="landing-hero-glow" aria-hidden />
          <RevealOnScroll>
            <div>
              <div className="landing-eyebrow">
                Free AI study workspace
              </div>
              <h1 id="landing-hero-heading">
                Everything you’re learning or working on.{" "}
                <span className="landing-em">In one Shelf.</span>
              </h1>
              <p className="landing-lead">
                Chat with PDF, ask an AI tutor from your notes, get summaries and
                mind maps, practice with flashcards and quizzes, write Docs, and
                plan revision — all in one free workspace. Teachers prepare tests
                from the same library.
              </p>
              <div className="landing-hero-actions">
                <Link href="/login" className="landing-btn landing-btn-primary">
                  <FolderPlus className="w-4 h-4" strokeWidth={1.75} aria-hidden />
                  Create your library
                </Link>
                <Link href="/learn" className="landing-btn">
                  <BookOpen className="w-4 h-4" strokeWidth={1.75} aria-hidden />
                  Browse free library
                </Link>
              </div>
              <p className="landing-micro">
                Learn and feature guides are open without sign-in. Your private
                library starts when you create an account.
              </p>
              <ul className="landing-featurelist" aria-label="Product areas">
                <li>
                  <FolderOpen strokeWidth={1.75} aria-hidden />
                  Library
                </li>
                <li>
                  <NotebookPen strokeWidth={1.75} aria-hidden />
                  Notebooks
                </li>
                <li>
                  <BookMarked strokeWidth={1.75} aria-hidden />
                  Research Docs
                </li>
                <li>
                  <Layers strokeWidth={1.75} aria-hidden />
                  Tabs &amp; split
                </li>
                <li>
                  <Sparkles strokeWidth={1.75} aria-hidden />
                  Study AI
                </li>
                <li>
                  <ListChecks strokeWidth={1.75} aria-hidden />
                  Quiz
                </li>
                <li>
                  <CalendarDays strokeWidth={1.75} aria-hidden />
                  Planner
                </li>
              </ul>
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

        <LandingFeatureGrid title="Everything at a glance" variant="landing" />

        <section className="landing-features-link">
          <Link href="/features">
            See all features — research Docs &amp; citations, YouTube lectures,
            Telegram import and send, sharing, offline PWA, Premium &amp; more →
          </Link>
        </section>

        <LandingGoalSection />

        <LandingCtaBanner
          title="One workspace for students and teachers."
          copy="Store material, ask Study AI, prepare or sit quizzes, and plan the week — Shelf is the study tool stack in a single app."
        />

        <MarketingFooter variant="landing" />
      </main>

      <LandingStickyCta />
    </div>
  );
}
