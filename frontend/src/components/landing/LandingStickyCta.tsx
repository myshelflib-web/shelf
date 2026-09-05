"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function LandingStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("landing-hero");
    const cta = document.getElementById("landing-cta");
    const scrollRoot = document.querySelector(".landing-page");
    if (!hero) return;

    let heroGone = false;
    let ctaNear = false;

    const sync = () => {
      setVisible(heroGone && !ctaNear);
    };

    const opts: IntersectionObserverInit = {
      root: scrollRoot instanceof Element ? scrollRoot : null,
      threshold: 0.08,
      rootMargin: "0px 0px -10% 0px",
    };

    const heroObserver = new IntersectionObserver(([entry]) => {
      heroGone = !entry.isIntersecting;
      sync();
    }, opts);

    heroObserver.observe(hero);

    let ctaObserver: IntersectionObserver | undefined;
    if (cta) {
      ctaObserver = new IntersectionObserver(
        ([entry]) => {
          ctaNear = entry.isIntersecting;
          sync();
        },
        {
          root: scrollRoot instanceof Element ? scrollRoot : null,
          threshold: 0.15,
          rootMargin: "80px 0px 0px 0px",
        }
      );
      ctaObserver.observe(cta);
    }

    return () => {
      heroObserver.disconnect();
      ctaObserver?.disconnect();
    };
  }, []);

  return (
    <div
      className={`landing-sticky-cta${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <div className="landing-sticky-cta-inner">
        <Link
          href="/login"
          className="landing-btn landing-btn-primary"
          tabIndex={visible ? 0 : -1}
        >
          Create your library
        </Link>
        <Link
          href="/learn"
          className="landing-btn"
          tabIndex={visible ? 0 : -1}
        >
          Browse free library
        </Link>
        <Link
          href="/login"
          className="landing-btn landing-btn-ghost"
          tabIndex={visible ? 0 : -1}
        >
          Sign in
        </Link>
        <Link
          href="/login?register=1"
          className="landing-btn landing-btn-ghost"
          tabIndex={visible ? 0 : -1}
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
