"use client";

import { useCallback, useEffect, useState } from "react";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingKicker } from "@/components/landing/LandingKicker";
import { MARKETING_FEATURE_GROUPS } from "@/lib/marketing";

const ROTATE_MS = 7000;

export function LandingFeatureShowcase({
  title = "Everything at a glance",
}: {
  title?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = MARKETING_FEATURE_GROUPS.length;

  const showGroup = useCallback(
    (index: number) => {
      setCurrent((index + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (paused) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  return (
    <section
      className="landing-features-section"
      aria-labelledby="landing-features-heading"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <RevealOnScroll>
        <LandingKicker index="05">Full feature set</LandingKicker>
        <h2 id="landing-features-heading" className="landing-value-title">
          {title}
        </h2>
        <p className="landing-value-copy mt-2">
          Research Docs with citations, reader workspace, YouTube lectures,
          Study AI, originality checks, quiz, planner, Telegram import and
          send, Spotify focus audio, sharing, and offline PWA — one calm
          surface for your own material.
        </p>
      </RevealOnScroll>

      <div
        className="landing-feature-tabs"
        role="tablist"
        aria-label="Feature categories"
      >
        {MARKETING_FEATURE_GROUPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`landing-feature-tab-${item.id}`}
            aria-selected={index === current}
            aria-controls={`landing-feature-panel-${item.id}`}
            className={`landing-feature-tab${
              index === current ? " landing-feature-tab-active" : ""
            }`}
            onClick={() => showGroup(index)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="landing-feature-stage">
        {MARKETING_FEATURE_GROUPS.map((item, index) => {
          const active = index === current;
          return (
            <div
              key={item.id}
              id={`landing-feature-panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={`landing-feature-tab-${item.id}`}
              hidden={!active}
              className={`landing-feature-panel${
                active ? " landing-feature-panel-active" : ""
              }`}
            >
              <p className="landing-feature-panel-blurb">{item.blurb}</p>
              <div className="landing-feature-card-row">
                {item.features.map((feature, featureIndex) => (
                  <article
                    key={feature.title}
                    className="landing-feature-card landing-feature-card-animated"
                    style={{ animationDelay: `${featureIndex * 70}ms` }}
                  >
                    <feature.icon aria-hidden />
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="landing-step-nav landing-feature-step-nav"
        role="presentation"
      >
        {MARKETING_FEATURE_GROUPS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show ${item.label}`}
            title={item.label}
            className={`landing-step-dot${
              index === current ? " landing-step-dot-active" : ""
            }`}
            onClick={() => showGroup(index)}
          />
        ))}
      </div>

      {/* Full catalog kept crawlable even when panels are hidden */}
      <ul className="landing-feature-seo-list">
        {MARKETING_FEATURE_GROUPS.flatMap((item) =>
          item.features.map((feature) => (
            <li key={feature.title}>
              <strong>{feature.title}</strong> — {feature.body}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
