"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  CalendarMockup,
  DashboardMockup,
  NotebooksMockup,
  StudyAIMockup,
  UploadMockup,
  WorkspaceMockup,
} from "./LandingShowcaseMockups";

const ROTATE_MS = 4000;

type ShowcaseSlide = {
  title: string;
  body: string;
  linkHref: string;
  linkLabel: string;
  visual: ReactNode;
  reverse?: boolean;
};

const SLIDES: ShowcaseSlide[] = [
  {
    title: "Upload your notes into private collections",
    body: "Bring PDFs and pages into folders you control. Choose parsed text for highlights and Study AI, or keep the original PDF when you need it.",
    linkHref: "/login",
    linkLabel: "Start uploading",
    visual: <UploadMockup />,
  },
  {
    title: "Create sketch notebooks and doc pages",
    body: "Not every page is a PDF. Add multi-sheet sketch notebooks for diagrams and handwriting, or typed doc pages for structured revision notes — in the same collection as your uploads.",
    linkHref: "/features/sketch-notes",
    linkLabel: "Notebooks & doc pages",
    visual: <NotebooksMockup />,
    reverse: true,
  },
  {
    title: "Open multiple pages — tabs and split view",
    body: "Keep up to 15 documents open in tabs, compare two sources side by side, and resize the library and Study AI panels. Layout and open tabs restore when you return.",
    linkHref: "/features/reader-workspace",
    linkLabel: "Reader workspace",
    visual: <WorkspaceMockup />,
  },
  {
    title: "Highlight a passage, ask Study AI",
    body: "Select any text while reading. Summarize, get short notes, build a mind map, or ask a follow-up — all grounded in what you uploaded.",
    linkHref: "/about",
    linkLabel: "How Study AI works",
    visual: <StudyAIMockup />,
    reverse: true,
  },
  {
    title: "Plan revision on your planner",
    body: "Add tasks and events that link back to your pages. See the week at a glance and open the exact note when it is time to study.",
    linkHref: "/login",
    linkLabel: "Open your planner",
    visual: <CalendarMockup />,
  },
  {
    title: "One dashboard for everything",
    body: "After sign-in, your dashboard brings together library, planner, pinned pages, and Study AI — no switching between tools.",
    linkHref: "/login",
    linkLabel: "See your dashboard",
    visual: <DashboardMockup />,
    reverse: true,
  },
];

export function LandingShowcaseCarousel() {
  const [current, setCurrent] = useState(0);
  const count = SLIDES.length;

  const showSlide = useCallback((index: number) => {
    setCurrent((index + count) % count);
  }, [count]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  return (
    <section
      className="landing-showcase-carousel-section"
      aria-labelledby="landing-showcase-heading"
    >
      <div className="landing-showcase-carousel-head">
        <div>
          <p className="landing-kicker">Product walkthrough</p>
          <h2 id="landing-showcase-heading" className="landing-showcase-carousel-title">
            See how Shelf fits your study flow
          </h2>
        </div>
        <p className="landing-showcase-carousel-meta">
          Auto-advancing preview · {current + 1} / {count}
        </p>
      </div>

      <div className="landing-showcase-carousel">
        <div className="landing-showcase-carousel-body">
          {SLIDES.map((slide, index) => (
            <div
              key={slide.title}
              className={`landing-showcase-slide${
                index === current ? " landing-showcase-slide-active" : ""
              }`}
              aria-hidden={index !== current}
            >
              <div
                className={`landing-showcase-slide-grid ${
                  slide.reverse ? "landing-showcase-slide-grid-reverse" : ""
                }`}
              >
                <div className="landing-showcase-slide-copy">
                  <h3>{slide.title}</h3>
                  <p>{slide.body}</p>
                  <Link href={slide.linkHref} className="landing-showcase-link">
                    {slide.linkLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="landing-showcase-slide-visual">{slide.visual}</div>
              </div>
            </div>
          ))}

          <div
            className="landing-step-nav landing-showcase-step-nav"
            role="tablist"
            aria-label="Feature showcase slides"
          >
            {SLIDES.map((slide, index) => (
              <button
                key={slide.title}
                type="button"
                role="tab"
                aria-selected={index === current}
                aria-label={slide.title}
                title={slide.title}
                className={`landing-step-dot${
                  index === current ? " landing-step-dot-active" : ""
                }`}
                onClick={() => showSlide(index)}
              />
            ))}
          </div>

          <div className="landing-preview-progress" aria-hidden>
            <span
              key={current}
              className="landing-showcase-progress-bar"
              style={{ animationDuration: `${ROTATE_MS / 1000}s` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
