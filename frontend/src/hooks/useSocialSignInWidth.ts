"use client";

import { useEffect, useRef, useState } from "react";

/** Full-width container for Google / Telegram login widgets (same row width). */
export function useSocialSignInWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setWidth(el.offsetWidth || 360);
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, width };
}
