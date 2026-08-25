"use client";

import { useEffect, type RefObject } from "react";
import { bindInkSurface } from "@/lib/inkSurface";

/** Block iOS/Android native selection while drawing or highlighting. */
export function useInkSurface(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    return bindInkSurface(el);
  }, [active, ref]);
}
