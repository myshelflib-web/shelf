"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SlideGoalPicker,
  SlideLibraryHome,
  SlidePdfReader,
  SlideStudyAi,
} from "./LandingPreviewSlides";

const SLIDE_COUNT = 4;
const ROTATE_MS = 3000;

export function LandingProductPreview() {
  const [current, setCurrent] = useState(0);

  const showSlide = useCallback((index: number) => {
    setCurrent(index % SLIDE_COUNT);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDE_COUNT);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const slides = [
    <SlideLibraryHome key="library" />,
    <SlidePdfReader key="reader" />,
    <SlideStudyAi key="study-ai" />,
    <SlideGoalPicker key="goal" />,
  ];

  return (
    <div className="landing-preview" id="product">
      <div className="landing-preview-head">
        <div className="landing-preview-title">Live product walkthrough</div>
        <div className="landing-preview-meta">Preview of the real app experience</div>
      </div>
      <div className="landing-preview-body">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`landing-slide${index === current ? " landing-slide-active" : ""}`}
            aria-hidden={index !== current}
          >
            {slide}
          </div>
        ))}
        <div className="landing-step-nav" role="tablist" aria-label="Product preview slides">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === current}
              aria-label={`Slide ${index + 1}`}
              className={`landing-step-dot${index === current ? " landing-step-dot-active" : ""}`}
              onClick={() => showSlide(index)}
            />
          ))}
        </div>
        <div className="landing-preview-progress" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}
