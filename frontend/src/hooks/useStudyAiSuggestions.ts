"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOrCreateSessionSeed,
  livelySlot,
} from "@/lib/livelyCopy";
import {
  STUDY_AI_HINT_ROTATE_MS,
  STUDY_AI_SUGGEST_ROTATE_MS,
  pickStudyAiFollowUps,
  pickStudyAiHint,
  pickStudyAiSuggestions,
  type StudyAiSuggestion,
} from "@/lib/studyAiSuggestions";

export function useStudyAiSuggestions(
  scope: "library" | "page",
  count = 3,
  mode: "suggest" | "followup" = "suggest"
) {
  const [seed] = useState(() =>
    typeof window === "undefined" ? "ssr" : getOrCreateSessionSeed()
  );
  const [slot, setSlot] = useState(() =>
    livelySlot(Date.now(), STUDY_AI_SUGGEST_ROTATE_MS)
  );
  const [hintSlot, setHintSlot] = useState(() =>
    livelySlot(Date.now(), STUDY_AI_HINT_ROTATE_MS)
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setSlot(livelySlot(Date.now(), STUDY_AI_SUGGEST_ROTATE_MS)),
      Math.min(STUDY_AI_SUGGEST_ROTATE_MS, 5_000)
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(
      () => setHintSlot(livelySlot(Date.now(), STUDY_AI_HINT_ROTATE_MS)),
      Math.min(STUDY_AI_HINT_ROTATE_MS, 4_000)
    );
    return () => window.clearInterval(id);
  }, []);

  const items = useMemo(
    () =>
      mode === "followup"
        ? pickStudyAiFollowUps(scope, { slot, sessionSeed: seed, count })
        : pickStudyAiSuggestions(scope, { slot, sessionSeed: seed, count }),
    [scope, slot, seed, count, mode]
  );

  const hint = useMemo(
    () =>
      pickStudyAiHint(mode === "followup" ? "followup" : scope, {
        slot: hintSlot,
        sessionSeed: seed,
      }),
    [mode, scope, hintSlot, seed]
  );

  return { items, hint };
}

/** Crossfade helper shared by suggest / follow-up chip rows. */
export function useCrossfadeItems<T extends { id: string }>(items: T[]) {
  const [visible, setVisible] = useState(true);
  const [shown, setShown] = useState(items);
  const allowFade = useRef(false);
  const key = items.map((i) => i.id).join("|");
  const shownKey = shown.map((i) => i.id).join("|");

  useEffect(() => {
    if (key === shownKey) {
      allowFade.current = true;
      return;
    }
    if (!allowFade.current) {
      setShown(items);
      setVisible(true);
      allowFade.current = true;
      return;
    }
    setVisible(false);
    const id = window.setTimeout(() => {
      setShown(items);
      setVisible(true);
    }, 200);
    return () => window.clearTimeout(id);
  }, [key, shownKey, items]);

  return { visible, shown };
}
