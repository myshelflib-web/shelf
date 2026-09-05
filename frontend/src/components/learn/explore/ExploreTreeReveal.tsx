"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

const REVEAL_MS = 180;

/** Animated expand/collapse for the Preloaded explorer tree. */
export function ExploreTreeReveal({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const timer = window.setTimeout(() => setMounted(false), REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={clsx(
        "explore-side-reveal",
        shown && "explore-side-reveal-open"
      )}
    >
      <div className="explore-side-branch">{children}</div>
    </div>
  );
}
