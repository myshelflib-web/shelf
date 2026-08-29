"use client";

import { ReactNode, useEffect, useState } from "react";

const MORPH_MS = 3400;

/** Crossfades between two related dual-window compositions (visual only). */
export function LandingShowcaseMorph({ frames }: { frames: [ReactNode, ReactNode] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((prev) => (prev === 0 ? 1 : 0));
    }, MORPH_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="landing-morph-wrap">
      <div className="landing-morph-stage" aria-live="polite">
        {frames.map((frame, index) => (
          <div
            key={index}
            className={`landing-morph-layer${
              index === active ? " landing-morph-layer-active" : ""
            }`}
            aria-hidden={index !== active}
          >
            {frame}
          </div>
        ))}
      </div>
    </div>
  );
}
