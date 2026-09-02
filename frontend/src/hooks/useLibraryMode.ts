"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { goalHasPreloadedLibrary } from "@/lib/studyGoal";
import {
  LIBRARY_MODE_KEY,
  LibraryMode,
  readLibraryMode,
  resolveLibraryMode,
  SHELF_LIBRARY_MODE_CHANGED,
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

  useEffect(() => {
    const syncPreferred = (mode: LibraryMode) => setPreferred(mode);
    const onChanged = (e: Event) => {
      const mode = (e as CustomEvent<{ mode: LibraryMode }>).detail?.mode;
      if (mode === "personal" || mode === "preloaded") syncPreferred(mode);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LIBRARY_MODE_KEY) return;
      if (e.newValue === "personal" || e.newValue === "preloaded") {
        syncPreferred(e.newValue);
      }
    };
    window.addEventListener(SHELF_LIBRARY_MODE_CHANGED, onChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SHELF_LIBRARY_MODE_CHANGED, onChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const mode = resolveLibraryMode(goal, preferred, isGuest);

  const setMode = useCallback((next: LibraryMode) => {
    setPreferred(next);
    writeLibraryMode(next);
  }, []);

  return { mode, setMode, showPreloaded, goal, isGuest };
}
