"use client";

import { useEffect, useState } from "react";

const PILLARS = [
  "Library",
  "Notebooks",
  "Tabs & split",
  "Study AI",
  "Quiz",
  "Planner",
] as const;

function PillarGroup({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="landing-marquee-group" aria-hidden={ariaHidden || undefined}>
      {PILLARS.map((label) => (
        <span key={label} className="landing-marquee-item">
          {label}
          <span className="landing-marquee-sep" aria-hidden />
        </span>
      ))}
    </div>
  );
}

export function LandingPillarMarquee() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (reduceMotion) {
    return (
      <div className="landing-marquee" aria-label="Product areas">
        <div className="landing-marquee-static">
          {PILLARS.map((label) => (
            <span key={label} className="landing-marquee-item">
              {label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="landing-marquee" aria-label="Product areas">
      <div className="landing-marquee-track">
        <PillarGroup />
        <PillarGroup ariaHidden />
      </div>
    </div>
  );
}
