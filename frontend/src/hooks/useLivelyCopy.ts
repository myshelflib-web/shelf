"use client";

import { useEffect, useState } from "react";
import {
  LIVELY_LINE_ROTATE_MS,
  LIVELY_SALUTATION_ROTATE_MS,
  LivelySurface,
  getOrCreateSessionSeed,
  livelySlot,
  pickGreetingSubtitle,
  pickGuestNickname,
  pickSalutation,
  pickSurfaceLine,
} from "@/lib/livelyCopy";

/** Stable for the browser session — sync so remounts don’t flash “boot” → real seed. */
function useSessionSeed() {
  const [seed] = useState(() =>
    typeof window === "undefined" ? "ssr" : getOrCreateSessionSeed()
  );
  return seed;
}

function useLivelySlot(rotateMs: number) {
  const [slot, setSlot] = useState(() => livelySlot(Date.now(), rotateMs));
  useEffect(() => {
    const tick = () => setSlot(livelySlot(Date.now(), rotateMs));
    // Align to slot boundaries; don’t force an immediate re-pick on mount.
    const id = window.setInterval(tick, Math.min(rotateMs, 5_000));
    return () => window.clearInterval(id);
  }, [rotateMs]);
  return slot;
}

/** Rotating salutation + greeting subtitle for GreetingBlock (~40s). */
export function useLivelyGreeting() {
  const sessionSeed = useSessionSeed();
  const slot = useLivelySlot(LIVELY_SALUTATION_ROTATE_MS);
  const hour = new Date().getHours();
  return {
    salutation: pickSalutation({ hour, sessionSeed, slot }),
    subtitle: pickGreetingSubtitle({ hour, sessionSeed, slot }),
    guestNickname: pickGuestNickname({ sessionSeed, slot }),
    slot,
  };
}

/** Rotating one-liner for a surface (library, calendar, Study AI, …) (~10s). */
export function useLivelySurfaceLine(surface: LivelySurface, salt = "") {
  const sessionSeed = useSessionSeed();
  const slot = useLivelySlot(LIVELY_LINE_ROTATE_MS);
  const hour = new Date().getHours();
  return pickSurfaceLine(surface, { sessionSeed, slot, salt, hour });
}
