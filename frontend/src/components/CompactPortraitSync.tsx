"use client";

import { useCompactPortrait } from "@/hooks/useCompactPortrait";

/** Sets `html[data-shelf-compact-portrait]` for global compact CSS on phone / tablet portrait. */
export function CompactPortraitSync() {
  useCompactPortrait();
  return null;
}
