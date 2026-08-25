export interface StreakMedal {
  days: number;
  label: string;
  emoji: string;
  color: string;
}

export const STREAK_MEDALS: StreakMedal[] = [
  { days: 3, label: "First steps", emoji: "🌱", color: "#7d9a82" },
  { days: 7, label: "Week warrior", emoji: "🔥", color: "#b8a06a" },
  { days: 14, label: "Fortnight focus", emoji: "⚡", color: "#7a8fb0" },
  { days: 30, label: "Monthly master", emoji: "🏆", color: "#b8ae6a" },
  { days: 60, label: "Dedicated scholar", emoji: "💎", color: "#8f82b0" },
  { days: 100, label: "Shelf legend", emoji: "👑", color: "#a88296" },
];

export function earnedMedals(streak: number) {
  return STREAK_MEDALS.filter((m) => streak >= m.days);
}

export function nextMedal(streak: number) {
  return STREAK_MEDALS.find((m) => streak < m.days);
}

/** Progress 0–100 toward the next medal (fills the streak dial). */
export function streakMedalProgress(streak: number) {
  const next = nextMedal(streak);
  if (!next) return 100;
  const prev =
    [...STREAK_MEDALS].reverse().find((m) => m.days <= streak)?.days ?? 0;
  const span = next.days - prev;
  if (span <= 0) return 100;
  return Math.round(((streak - prev) / span) * 100);
}
