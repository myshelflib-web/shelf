"use client";

import { useEffect, useState } from "react";

/** Phone, or tablet in portrait — stack/overlay instead of multi-column chrome. */
export function useCompactPortrait(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const sync = () => {
      const phone = window.matchMedia("(max-width: 767px)").matches;
      const tabletPortrait = window.matchMedia(
        "(max-width: 1024px) and (orientation: portrait)",
      ).matches;
      setCompact(phone || tabletPortrait);
    };
    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (compact) {
      root.dataset.shelfCompactPortrait = "";
    } else {
      delete root.dataset.shelfCompactPortrait;
    }
    return () => {
      delete root.dataset.shelfCompactPortrait;
    };
  }, [compact]);

  return compact;
}
