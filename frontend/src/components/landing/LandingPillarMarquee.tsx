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

/** Enough identical strips that 50% of the track always exceeds the viewport. */
const STRIP_COUNT = 8;

function PillarGroup({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div className="landing-marquee-group" aria-hidden={ariaHidden || undefined}>
      {PILLARS.map((label) => (
        <span key={label} className="landing-marquee-item">
          <span className="landing-marquee-sep" aria-hidden />
          {label}
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
        {Array.from({ length: STRIP_COUNT }, (_, index) => (
          <PillarGroup key={index} ariaHidden={index > 0} />
        ))}
      </div>
    </div>
  );
}
