"use client";

import { useEffect } from "react";

/**
 * Soft accent spotlight clipped to `.landing-torch-zone` sections only
 * (hero, product walkthrough, CTA). Disabled for touch / reduced motion.
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
      let local = zone.querySelector<HTMLElement>(":scope > .landing-torch-local");
      if (!local) {
        local = document.createElement("div");
        local.className = "landing-torch-local";
        local.setAttribute("aria-hidden", "true");
        zone.insertBefore(local, zone.firstChild);
      }

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
        local?.remove();
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}
