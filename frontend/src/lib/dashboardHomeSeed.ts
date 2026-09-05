import { peekCachedLibrary } from "@/lib/offline/library";
import { getReadingStats } from "@/lib/readingStats";
import {
  getLastRead,
  getRecentNotebookReads,
  type LastRead,
} from "@/lib/tabViewState";
import type { StudyTask, UserPageSummary, UserSubject } from "@/types";

export const DASHBOARD_RECENT_NOTEBOOKS = 3;

export type DashboardHomeSnapshot = {
  listed: UserSubject[];
  rootPages: UserPageSummary[];
  notebookTotal: number;
  recentNotebooks: UserSubject[];
  lastRead: LastRead | null;
  tasks: StudyTask[];
};

export type DashboardReadingSeed = {
  streak: number;
  todaySeconds: number;
  activeDates: string[];
};

let sessionSnapshot: DashboardHomeSnapshot | null = null;

export function rememberDashboardHome(snap: DashboardHomeSnapshot) {
  sessionSnapshot = snap;
}

export function clearDashboardHomeSession() {
  sessionSnapshot = null;
}

export function peekDashboardHomeSession(): DashboardHomeSnapshot | null {
  return sessionSnapshot;
}

/** Sync-order recent folders from a subject list + local last-read map. */
export function pickRecentNotebooks(
  listed: UserSubject[],
  limit = DASHBOARD_RECENT_NOTEBOOKS
): UserSubject[] {
  const bySlug = new Map(listed.map((s) => [s.slug, s]));
  const ordered: UserSubject[] = [];
  const used = new Set<string>();
  for (const read of getRecentNotebookReads()) {
    const slug = read.notebookSlug;
    if (!slug || used.has(slug)) continue;
    const nb = bySlug.get(slug);
    if (!nb) continue;
    ordered.push(nb);
    used.add(slug);
    if (ordered.length >= limit) return ordered;
  }
  for (const s of listed) {
    if (used.has(s.slug)) continue;
    ordered.push(s);
    used.add(s.slug);
    if (ordered.length >= limit) break;
  }
  return ordered;
}

export function seedReadingStats(): DashboardReadingSeed {
  if (typeof window === "undefined") {
    return { streak: 0, todaySeconds: 0, activeDates: [] };
  }
  const stats = getReadingStats();
  return {
    streak: stats.streak,
    todaySeconds: stats.todaySeconds,
    activeDates: stats.activeDates,
  };
}

/** Paint dashboard from memory / localStorage before network returns. */
export function seedDashboardHome(): DashboardHomeSnapshot & {
  reading: DashboardReadingSeed;
} {
  const reading = seedReadingStats();
  const lastRead =
    typeof window !== "undefined"
      ? getLastRead() ?? getRecentNotebookReads()[0] ?? null
      : null;

  if (sessionSnapshot) {
    return {
      ...sessionSnapshot,
      lastRead: lastRead ?? sessionSnapshot.lastRead,
      reading,
    };
  }

  const cached =
    typeof window !== "undefined" ? peekCachedLibrary() : null;
  const listed = cached?.subjects ?? [];
  const rootPages = cached?.rootPages ?? [];
  return {
    listed,
    rootPages,
    notebookTotal: cached?.total ?? listed.length,
    recentNotebooks: pickRecentNotebooks(listed),
    lastRead,
    tasks: [],
    reading,
  };
}
