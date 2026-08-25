"use client";

import { useEffect, useState } from "react";
import { isTouchPrimaryUi } from "@/lib/hotkeys";

/** Phones / tablets / iPads — keyboard shortcuts stay off. */
export function useTouchPrimaryUi(): boolean {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    const sync = () => setTouch(isTouchPrimaryUi());
    sync();
    const hover = window.matchMedia("(hover: none)");
    const coarse = window.matchMedia("(pointer: coarse)");
    hover.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      hover.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

  return touch;
}
