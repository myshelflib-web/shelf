import type { NotebookSort } from "@/types";

export const SIDEBAR_PINNED_KEY = "shelf:explorer-pinned";
export const SIDEBAR_SORT_KEY = "shelf:explorer-sort";
export const SIDEBAR_SORT_ASC_KEY = "shelf:explorer-sort-asc";
export const SIDEBAR_MAX_PINNED = 5;

export type SortCriterion = "activity" | "name";

export function notebookSortFor(
  criterion: SortCriterion,
  ascending: boolean
): NotebookSort {
  if (criterion === "name") return ascending ? "name" : "nameDesc";
  return ascending ? "oldest" : "recent";
}

export function directionTitle(
  criterion: SortCriterion,
  ascending: boolean
): string {
  if (criterion === "name") {
    return ascending ? "Ascending — A to Z" : "Descending — Z to A";
  }
  return ascending
    ? "Ascending — least recent first"
    : "Descending — most recent first";
}

export function readSortCriterion(): SortCriterion {
  if (typeof window === "undefined") return "activity";
  try {
    const raw = localStorage.getItem(SIDEBAR_SORT_KEY);
    if (raw === "activity" || raw === "name") return raw;
    if (raw === "manual") return "activity";
  } catch {
    /* ignore */
  }
  return "activity";
}

export function readSortAscending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_SORT_ASC_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSortAscending(ascending: boolean) {
  try {
    localStorage.setItem(SIDEBAR_SORT_ASC_KEY, ascending ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function readPinnedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIDEBAR_PINNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

export function pushPinnedSlug(slug: string) {
  const next = [
    slug,
    ...readPinnedSlugs().filter((s) => s !== slug),
  ].slice(0, SIDEBAR_MAX_PINNED);
  try {
    localStorage.setItem(SIDEBAR_PINNED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function removePinnedSlug(slug: string) {
  const next = readPinnedSlugs().filter((s) => s !== slug);
  try {
    localStorage.setItem(SIDEBAR_PINNED_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
