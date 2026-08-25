"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  GUEST_STUDY_GOAL_CHANGED,
  readGuestStudyGoal,
  writeGuestStudyGoal,
  learnCatalogGoal,
} from "@/lib/guestStudyGoal";
import { normalizeStudyGoal } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";

export function useLearnStudyGoal() {
  const { user } = useAuth();
  const [guestGoal, setGuestGoal] = useState<StudyGoal>(() => readGuestStudyGoal());

  useEffect(() => {
    const sync = () => setGuestGoal(readGuestStudyGoal());
    window.addEventListener("storage", sync);
    window.addEventListener(GUEST_STUDY_GOAL_CHANGED, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(GUEST_STUDY_GOAL_CHANGED, sync);
    };
  }, []);

  const accountGoal = user ? normalizeStudyGoal(user.studyGoal) : null;
  const goal = learnCatalogGoal(accountGoal, guestGoal);

  const setGuestGoalChoice = useCallback((next: StudyGoal) => {
    writeGuestStudyGoal(next);
    setGuestGoal(next);
  }, []);

  return {
    goal,
    guestGoal,
    setGuestGoal: setGuestGoalChoice,
    /** Guests pick a track; signed-in users follow profile goal. */
    showGoalPicker: !user,
    accountGoal,
  };
}
