/** Local prefs for Spotify focus audio (embed MVP — no OAuth). */

import { parseSpotifyInput } from "@/lib/spotifyEmbed";

const GLOBAL_URL_KEY = "shelf:spotify-url";
const RECENT_KEY = "shelf:spotify-recent";
const NOTEBOOK_PREFIX = "shelf:spotify-notebook:";
const MAX_RECENT = 6;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getSpotifyUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GLOBAL_URL_KEY) ?? "";
}

export function setSpotifyUrl(url: string): void {
  if (typeof window === "undefined") return;
  const parsed = parseSpotifyInput(url);
  const store = parsed?.openUrl ?? url.trim();
  if (!store) {
    localStorage.removeItem(GLOBAL_URL_KEY);
    return;
  }
  localStorage.setItem(GLOBAL_URL_KEY, store);
  pushRecent(store);
}

export function getRecentSpotifyUrls(): string[] {
  return readJson<string[]>(RECENT_KEY, []).filter(Boolean);
}

function pushRecent(url: string): void {
  const next = [url, ...getRecentSpotifyUrls().filter((u) => u !== url)].slice(
    0,
    MAX_RECENT
  );
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function getNotebookSpotifyUrl(notebookId: string): string {
  if (typeof window === "undefined" || !notebookId) return "";
  return localStorage.getItem(`${NOTEBOOK_PREFIX}${notebookId}`) ?? "";
}

export function setNotebookSpotifyUrl(
  notebookId: string,
  url: string | null
): void {
  if (typeof window === "undefined" || !notebookId) return;
  const key = `${NOTEBOOK_PREFIX}${notebookId}`;
  if (!url?.trim()) {
    localStorage.removeItem(key);
    return;
  }
  const parsed = parseSpotifyInput(url);
  localStorage.setItem(key, parsed?.openUrl ?? url.trim());
}

/** Prefer notebook focus playlist when set; else last global URL. */
export function resolveSpotifyUrl(notebookId?: string | null): string {
  if (notebookId) {
    const nb = getNotebookSpotifyUrl(notebookId);
    if (nb) return nb;
  }
  return getSpotifyUrl();
}
