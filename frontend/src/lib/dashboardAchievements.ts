export type AchievementId =
  | "first-read"
  | "three-day"
  | "week"
  | "library"
  | "regular"
  | "fortnight"
  | "month"
  | "legend";

export interface AchievementDef {
  id: AchievementId;
  label: string;
  hint: string;
  /** Muted on-brand tint for the unlocked icon. */
  color: string;
}

export const DASHBOARD_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-read",
    label: "First session",
    hint: "Read on any day",
    color: "#7d9a82",
  },
  {
    id: "three-day",
    label: "First steps",
    hint: "3-day streak",
    color: "#b8a06a",
  },
  {
    id: "week",
    label: "Week warrior",
    hint: "7-day streak",
    color: "#c9a066",
  },
  {
    id: "library",
    label: "Collector",
    hint: "Add a folder or file",
    color: "var(--accent)",
  },
  {
    id: "regular",
    label: "Showing up",
    hint: "7 active days",
    color: "#8f82b0",
  },
  {
    id: "fortnight",
    label: "Fortnight focus",
    hint: "14-day streak",
    color: "#7a8fb0",
  },
  {
    id: "month",
    label: "Monthly master",
    hint: "30-day streak",
    color: "#b8ae6a",
  },
  {
    id: "legend",
    label: "Shelf legend",
    hint: "100-day streak",
    color: "#a88296",
  },
];

export function isAchievementEarned(
  id: AchievementId,
  stats: { streak: number; activeDays: number; hasLibrary: boolean }
): boolean {
  switch (id) {
    case "first-read":
      return stats.activeDays >= 1 || stats.streak >= 1;
    case "three-day":
      return stats.streak >= 3;
    case "week":
      return stats.streak >= 7;
    case "library":
      return stats.hasLibrary;
    case "regular":
      return stats.activeDays >= 7;
    case "fortnight":
      return stats.streak >= 14;
    case "month":
      return stats.streak >= 30;
    case "legend":
      return stats.streak >= 100;
  }
}

export function dashboardAchievementState(stats: {
  streak: number;
  activeDays: number;
  hasLibrary: boolean;
}) {
  return DASHBOARD_ACHIEVEMENTS.map((def) => ({
    ...def,
    earned: isAchievementEarned(def.id, stats),
  }));
}
