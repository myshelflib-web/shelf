import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import type { ShelfFeature } from "@/lib/seo/featureTypes";
import { FEATURE_CATEGORIES } from "@/lib/seo/featureCategories";
import {
  SHELF_FEATURES,
  featurePagePath,
} from "@/lib/seo/featureCatalog";
import { ArrowRight, BookOpen } from "lucide-react";

export function FeatureLanding({ feature }: { feature: ShelfFeature }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <section className="relative px-4 sm:px-6 py-16 sm:py-24 max-w-3xl mx-auto text-center overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <RevealOnScroll>
            <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
              Shelf feature
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
              {feature.headline}
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              {feature.subhead}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={feature.ctaHref} className="btn-primary">
                {feature.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
              {feature.secondaryCtaHref && feature.secondaryCtaLabel ? (
                <Link href={feature.secondaryCtaHref} className="btn-secondary">
                  {feature.secondaryCtaLabel}
                </Link>
              ) : null}
              {feature.relatedBlogSlug ? (
                <Link
                  href={`/blog/${feature.relatedBlogSlug}`}
                  className="btn-secondary"
                >
                  Read the guide
                </Link>
              ) : null}
            </div>
          </RevealOnScroll>
        </section>

        <section className="px-4 sm:px-6 pb-12 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center sm:text-left">
            What you get
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {feature.bullets.map((bullet, i) => (
              <RevealOnScroll key={bullet} delay={i * 50}>
                <li className="feature-card p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] leading-relaxed list-none">
                  {bullet}
                </li>
              </RevealOnScroll>
            ))}
          </ul>
        </section>

        {feature.paragraphs.map((paragraph, i) => (
          <section
            key={paragraph.slice(0, 40)}
            className="px-4 sm:px-6 pb-10 max-w-3xl mx-auto"
          >
            <RevealOnScroll delay={i * 60}>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {paragraph}
              </p>
            </RevealOnScroll>
          </section>
        ))}

        <section className="px-4 sm:px-6 pb-20 max-w-3xl mx-auto text-center border-t border-[var(--border)] pt-12">
          <RevealOnScroll>
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-6"
            >
              <BookOpen className="w-4 h-4" />
              All Shelf features
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href={feature.ctaHref} className="btn-primary">
                {feature.ctaLabel}
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign in free
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

export function FeaturesHub() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <section className="relative px-4 sm:px-6 py-16 sm:py-20 max-w-4xl mx-auto text-center overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <RevealOnScroll>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Every Shelf feature
            </h1>
            <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Granular guides to PDF libraries, Study AI, Quiz, Telegram import,
              Spotify focus audio, sharing, planner, and more — for students and
              professionals in India and beyond.
            </p>
          </RevealOnScroll>
        </section>

        <div className="px-4 sm:px-6 pb-20 max-w-4xl mx-auto space-y-14">
          {FEATURE_CATEGORIES.map((category) => {
            const items = SHELF_FEATURES.filter(
              (f) => f.category === category.id
            );
            if (!items.length) return null;
            return (
              <section key={category.id}>
                <RevealOnScroll>
                  <h2 className="text-xl font-semibold mb-1">{category.label}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-6">
                    {category.description}
                  </p>
                </RevealOnScroll>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((feature, i) => (
                    <RevealOnScroll key={feature.slug} delay={i * 40}>
                      <Link
                        href={featurePagePath(feature)}
                        className="feature-card block p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] h-full hover:border-[var(--accent)] transition"
                      >
                        <h3 className="font-semibold mb-2">{feature.headline}</h3>
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                          {feature.subhead}
                        </p>
                      </Link>
                    </RevealOnScroll>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
