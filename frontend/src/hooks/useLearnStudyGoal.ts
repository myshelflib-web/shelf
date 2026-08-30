"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  GUEST_STUDY_GOAL_CHANGED,
  readLearnCatalogFilter,
  writeLearnCatalogFilter,
} from "@/lib/guestStudyGoal";
import { normalizeStudyGoal } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";

export function useLearnStudyGoal(initialGoal?: StudyGoal) {
  const { user } = useAuth();
  const [filterGoal, setFilterGoal] = useState<StudyGoal>(() =>
    initialGoal ?? readLearnCatalogFilter()
  );

  useEffect(() => {
    if (initialGoal) {
      writeLearnCatalogFilter(initialGoal);
      setFilterGoal(initialGoal);
    }
  }, [initialGoal]);

  useEffect(() => {
    const sync = () => setFilterGoal(readLearnCatalogFilter());
    window.addEventListener("storage", sync);
    window.addEventListener(GUEST_STUDY_GOAL_CHANGED, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(GUEST_STUDY_GOAL_CHANGED, sync);
    };
  }, []);

  const accountGoal = user ? normalizeStudyGoal(user.studyGoal) : null;

  const setFilterGoalChoice = useCallback((next: StudyGoal) => {
    writeLearnCatalogFilter(next);
    setFilterGoal(next);
  }, []);

  return {
    goal: filterGoal,
    guestGoal: filterGoal,
    setGuestGoal: setFilterGoalChoice,
    /** Optional track filter — never pre-applied from profile goal. */
    showGoalPicker: true,
    accountGoal,
  };
}
