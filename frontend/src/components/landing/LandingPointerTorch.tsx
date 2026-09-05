"use client";

import { useEffect } from "react";

/**
 * Pointer spotlight on `.landing-torch-zone` sections only
 * (hero, product walkthrough, CTA). Off for touch / reduced motion.
 */
export function LandingPointerTorch() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing-page");
    if (!root) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;

    const zones = Array.from(
      root.querySelectorAll<HTMLElement>(".landing-torch-zone")
    );
    if (zones.length === 0) return;

    const cleanups: Array<() => void> = [];

    for (const zone of zones) {
      const onMove = (event: PointerEvent) => {
        const rect = zone.getBoundingClientRect();
        zone.style.setProperty("--torch-x", `${event.clientX - rect.left}px`);
        zone.style.setProperty("--torch-y", `${event.clientY - rect.top}px`);
        zone.classList.add("is-torch-on");
      };

      const onLeave = () => {
        zone.classList.remove("is-torch-on");
      };

      zone.addEventListener("pointermove", onMove, { passive: true });
      zone.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        zone.removeEventListener("pointermove", onMove);
        zone.removeEventListener("pointerleave", onLeave);
        zone.classList.remove("is-torch-on");
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
