"use client";

import { Loader2 } from "lucide-react";

const sizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
} as const;

/** Accent circle spinner for async slots (avoids sudden content pop-in). */
export function CircleLoader({
  size = "md",
  className = "",
  label = "Loading",
}: {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}) {
  return (
    <Loader2
      aria-label={label}
      className={`animate-spin text-[var(--accent)] ${sizes[size]} ${className}`}
    />
  );
}
