"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOrCreateSessionSeed,
  livelySlot,
} from "@/lib/livelyCopy";
import {
  STUDY_AI_SUGGEST_ROTATE_MS,
  pickStudyAiSuggestions,
} from "@/lib/studyAiSuggestions";

export function useStudyAiSuggestions(scope: "library" | "page", count = 3) {
  const [seed] = useState(() =>
    typeof window === "undefined" ? "ssr" : getOrCreateSessionSeed()
  );
  const [slot, setSlot] = useState(() =>
    livelySlot(Date.now(), STUDY_AI_SUGGEST_ROTATE_MS)
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setSlot(livelySlot(Date.now(), STUDY_AI_SUGGEST_ROTATE_MS)),
      Math.min(STUDY_AI_SUGGEST_ROTATE_MS, 5_000)
    );
    return () => window.clearInterval(id);
  }, []);

  return useMemo(
    () => pickStudyAiSuggestions(scope, { slot, sessionSeed: seed, count }),
    [scope, slot, seed, count]
  );
}
