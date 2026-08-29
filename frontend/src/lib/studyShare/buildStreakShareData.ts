import type { StudyGoal } from "@/types";
import { earnedMedals } from "@/lib/streakMedals";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { formatReadingTime, type ReadingStats } from "@/lib/readingStats";
import { last7DayActivity } from "@/lib/studyShare/last7Days";
import { localYmd } from "@/lib/monthGrid";

export type StreakShareCardData = {
  streak: number;
  todayLabel: string;
  activeDays: number;
  weekActivity: boolean[];
  latestMedal: { label: string; emoji: string; color: string } | null;
  studyGoalLabel: string | null;
};

export function studyGoalShareLabel(goal: StudyGoal | null | undefined): string | null {
  if (!goal || goal === "GENERAL") return null;
  const full = STUDY_GOAL_LABELS[goal];
  if (goal === "UPSC") return "UPSC";
  if (goal === "STATE_PCS") return "State PCS";
  if (goal === "NEET_PG") return "NEET PG";
  if (goal === "CA") return "CA";
  if (goal === "GATE") return "GATE";
  if (goal === "JUDICIARY") return "Judiciary";
  return full;
}

export function buildStreakShareData(
  stats: ReadingStats,
  studyGoal?: StudyGoal | null
): StreakShareCardData {
  const today = localYmd(new Date());
  const medals = earnedMedals(stats.streak);
  const latest = medals[medals.length - 1] ?? null;

  return {
    streak: stats.streak,
    todayLabel: formatReadingTime(stats.todaySeconds),
    activeDays: stats.activeDates.length,
    weekActivity: last7DayActivity(stats.activeDates, today),
    latestMedal: latest
      ? { label: latest.label, emoji: latest.emoji, color: latest.color }
      : null,
    studyGoalLabel: studyGoalShareLabel(studyGoal),
  };
}
