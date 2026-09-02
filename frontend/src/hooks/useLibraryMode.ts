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
  const { goal: filterGoal, accountGoal } = useLearnStudyGoal();
  const isGuest = !user;
  const goal = isGuest ? filterGoal : (accountGoal ?? "GENERAL");
  const showPreloaded = goalHasPreloadedLibrary(goal);

  const [preferred, setPreferred] = useState<LibraryMode | null>(null);

  useEffect(() => {
    setPreferred(readLibraryMode());
  }, []);

  const mode = resolveLibraryMode(goal, preferred, isGuest);

  const setMode = useCallback((next: LibraryMode) => {
    setPreferred(next);
    writeLibraryMode(next);
  }, []);

  return { mode, setMode, showPreloaded, goal, isGuest };
}
