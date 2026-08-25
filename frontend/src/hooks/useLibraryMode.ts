"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { goalHasPreloadedLibrary } from "@/lib/studyGoal";
import {
  LibraryMode,
  readLibraryMode,
  resolveLibraryMode,
  writeLibraryMode,
} from "@/lib/libraryMode";

export function useLibraryMode() {
  const { user } = useAuth();
  const { goal } = useLearnStudyGoal();
  const showPreloaded = goalHasPreloadedLibrary(goal);
  const isGuest = !user;

  const [preferred, setPreferred] = useState<LibraryMode>("personal");

  useEffect(() => {
    setPreferred(readLibraryMode());
  }, []);

  const mode = resolveLibraryMode(goal, preferred, isGuest);

  const setMode = useCallback(
    (next: LibraryMode) => {
      if (next === "preloaded" && !goalHasPreloadedLibrary(goal)) return;
      setPreferred(next);
      writeLibraryMode(next);
    },
    [goal]
  );

  return { mode, setMode, showPreloaded, goal, isGuest };
}
