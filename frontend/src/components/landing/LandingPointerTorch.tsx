"use client";

import { useEffect } from "react";

/**
 * Soft accent spotlight that follows the pointer over the landing page
 * (portfolio-style warmth). Disabled for touch / reduced motion.
 */
export function LandingPointerTorch() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing-page");
    if (!root) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;

    const onMove = (event: PointerEvent) => {
      root.style.setProperty("--torch-x", `${event.clientX}px`);
      root.style.setProperty("--torch-y", `${event.clientY}px`);
      root.classList.add("is-torch-on");
    };

    const onLeave = () => {
      root.classList.remove("is-torch-on");
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.classList.remove("is-torch-on");
    };
  }, []);

  return <div className="landing-torch" aria-hidden />;
}
