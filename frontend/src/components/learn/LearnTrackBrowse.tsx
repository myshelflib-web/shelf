"use client";

import { useEffect } from "react";
import { LearnBrowseWorkspace } from "@/components/learn/LearnBrowseWorkspace";
import { writeLearnCatalogFilter } from "@/lib/guestStudyGoal";
import { StudyGoal } from "@/types";

/** Track landing catalog — applies the track filter once on mount. */
export function LearnTrackBrowse({
  goal,
}: {
  goal: Exclude<StudyGoal, "GENERAL">;
}) {
  useEffect(() => {
    writeLearnCatalogFilter(goal);
  }, [goal]);

  return <LearnBrowseWorkspace initialGoal={goal} />;
}
