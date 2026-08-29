"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Full-width container for Google / Telegram login widgets (same row width). */
export function useSocialSignInWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next <= 0) return;
      setWidth((prev) => (prev > 0 && Math.abs(prev - next) < 8 ? prev : next));
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}
