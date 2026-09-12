"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingKicker } from "@/components/landing/LandingKicker";
import {
  MARKETING_FEATURES,
  type MarketingFeature,
} from "@/lib/marketing";

function FeatureMarqueeCard({ feature }: { feature: MarketingFeature }) {
  return (
    <article className="landing-feature-card landing-feature-marquee-card">
      <feature.icon aria-hidden />
      <h3>{feature.title}</h3>
      <p>{feature.body}</p>
    </article>
  );
}

function MarqueeRow({
  features,
  direction,
  durationSec,
}: {
  features: MarketingFeature[];
  direction: "left" | "right";
  durationSec: number;
}) {
  // Duplicate for seamless loop
  const loop = [...features, ...features];
  return (
    <div
      className={`landing-feature-marquee-row landing-feature-marquee-${direction}`}
      style={{ ["--marquee-duration" as string]: `${durationSec}s` }}
    >
      <div className="landing-feature-marquee-track">
        {loop.map((feature, index) => (
          <FeatureMarqueeCard
            key={`${feature.title}-${index}`}
            feature={feature}
          />
        ))}
      </div>
    </div>
  );
}

export function LandingFeatureShowcase({
  title = "Everything at a glance",
}: {
  title?: string;
}) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const mid = Math.ceil(MARKETING_FEATURES.length / 2);
  const rowA = MARKETING_FEATURES.slice(0, mid);
  const rowB = MARKETING_FEATURES.slice(mid);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <section
      className="landing-features-section landing-features-marquee-section"
      aria-labelledby="landing-features-heading"
    >
      <RevealOnScroll>
        <div className="landing-features-head">
          <LandingKicker index="05">Full feature set</LandingKicker>
          <h2 id="landing-features-heading" className="landing-value-title">
            {title}
          </h2>
          <p className="landing-features-lead">
            Research Docs, reader workspace, YouTube lectures, Study AI,
            originality checks, quiz, planner, Telegram, Spotify, sharing, and
            offline PWA — one calm surface for your own material.
          </p>
        </div>
      </RevealOnScroll>

      {reduceMotion ? (
        <div className="landing-feature-static-grid">
          {MARKETING_FEATURES.map((feature) => (
            <FeatureMarqueeCard key={feature.title} feature={feature} />
          ))}
        </div>
      ) : (
        <div className="landing-feature-marquee" aria-hidden="true">
          <MarqueeRow features={rowA} direction="left" durationSec={48} />
          <MarqueeRow features={rowB} direction="right" durationSec={56} />
        </div>
      )}

      <p className="landing-feature-all-link">
        <Link href="/features">Browse every feature in detail →</Link>
      </p>

      <ul className="landing-feature-seo-list">
        {MARKETING_FEATURES.map((feature) => (
          <li key={feature.title}>
            <strong>{feature.title}</strong> — {feature.body}
          </li>
        ))}
      </ul>
    </section>
  );
}
