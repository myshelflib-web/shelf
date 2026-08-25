export const READING_STATS_KEY = "shelf:reading-stats";
const GOAL_KEY = "shelf:reading-goal-minutes";

export const READING_GOAL_MINUTES = [15, 30, 45, 60, 90, 120] as const;

export interface ReadingStats {
  streak: number;
  lastActiveDate: string;
  todaySeconds: number;
  activeDates: string[];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function emptyStats(): ReadingStats {
  return { streak: 0, lastActiveDate: "", todaySeconds: 0, activeDates: [] };
}

function currentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const id = (JSON.parse(raw) as { id?: unknown })?.id;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

export function readingStatsKeyFor(userId: string) {
  return `${READING_STATS_KEY}:${userId}`;
}

function statsStorageKey(): string | null {
  const id = currentUserId();
  return id ? readingStatsKeyFor(id) : null;
}

function normalize(raw: Partial<ReadingStats>): ReadingStats {
  const dates = new Set(raw.activeDates ?? []);
  if (raw.lastActiveDate) dates.add(raw.lastActiveDate);
  return {
    streak: raw.streak ?? 0,
    lastActiveDate: raw.lastActiveDate ?? "",
    todaySeconds: raw.todaySeconds ?? 0,
    activeDates: [...dates].sort().slice(-400),
  };
}

function load(): ReadingStats {
  if (typeof window === "undefined") return emptyStats();
  const key = statsStorageKey();
  if (!key) return emptyStats();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyStats();
    return normalize(JSON.parse(raw) as Partial<ReadingStats>);
  } catch {
    return emptyStats();
  }
}

function save(stats: ReadingStats) {
  const key = statsStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(normalize(stats)));
  window.dispatchEvent(new Event("shelf:reading-stats-changed"));
}

/**
 * Move a legacy device-wide streak blob onto one account, then delete it.
 * Pass null to drop it without giving it to the incoming user.
 */
export function adoptUnkeyedReadingStats(ownerId: string | null) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(READING_STATS_KEY);
    if (!raw) return;
    if (ownerId) {
      const keyed = readingStatsKeyFor(ownerId);
      if (!localStorage.getItem(keyed)) {
        localStorage.setItem(keyed, raw);
      }
    }
    localStorage.removeItem(READING_STATS_KEY);
  } catch {
    /* ignore */
  }
}

export function getReadingStats(): ReadingStats {
  const stats = load();
  const today = todayKey();
  if (stats.lastActiveDate !== today) {
    return { ...stats, todaySeconds: 0 };
  }
  return stats;
}

export function tickReading(seconds: number) {
  if (seconds <= 0 || !currentUserId()) return;
  const today = todayKey();
  const stats = load();
  let streak = stats.streak;

  if (stats.lastActiveDate === today) {
    stats.todaySeconds += seconds;
  } else if (stats.lastActiveDate) {
    const prev = new Date(`${stats.lastActiveDate}T12:00:00`);
    const cur = new Date(`${today}T12:00:00`);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    streak = diff === 1 ? stats.streak + 1 : 1;
    stats.todaySeconds = seconds;
  } else {
    streak = 1;
    stats.todaySeconds = seconds;
  }

  stats.streak = streak;
  stats.lastActiveDate = today;
  const dates = new Set(stats.activeDates);
  dates.add(today);
  stats.activeDates = [...dates].sort().slice(-400);
  save(stats);
}

export function formatReadingTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

export function percentLeft(used: number, limit: number) {
  if (!limit) return 100;
  return Math.max(0, Math.min(100, Math.round(100 - (used / limit) * 100)));
}

export function getReadingGoalMinutes(): number {
  if (typeof window === "undefined") return 45;
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    const n = raw ? Number(raw) : 45;
    return READING_GOAL_MINUTES.includes(n as (typeof READING_GOAL_MINUTES)[number])
      ? n
      : 45;
  } catch {
    return 45;
  }
}

export function setReadingGoalMinutes(minutes: number) {
  const clamped = READING_GOAL_MINUTES.includes(
    minutes as (typeof READING_GOAL_MINUTES)[number]
  )
    ? minutes
    : 45;
  localStorage.setItem(GOAL_KEY, String(clamped));
  window.dispatchEvent(new Event("shelf:reading-goal-changed"));
}

export function readingGoalProgress(todaySeconds: number, goalMinutes?: number) {
  const goal = (goalMinutes ?? getReadingGoalMinutes()) * 60;
  if (!goal) return 0;
  return Math.min(100, Math.round((todaySeconds / goal) * 100));
}
