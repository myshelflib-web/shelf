/**
 * Browser state that belongs to a signed-in account (not device prefs like theme).
 * Cleared on logout and when a different user signs in so nothing leaks.
 */

import {
  WORKSPACE_CHANGED_EVENT,
  WORKSPACE_STORAGE_KEY,
} from "@/components/my-content/reader/types";
import { adoptUnkeyedReadingStats } from "@/lib/readingStats";
import { clearPdfByteCache } from "@/lib/pdfByteCache";
import { clearPdfDeleteUndos } from "@/lib/pdfDeleteUndo";
import { clearOfflineDb } from "@/lib/offline/db";

/** Known account keys — wipe also deletes any other `shelf:*` key. */
export const ACCOUNT_LOCAL_KEYS = [
  WORKSPACE_STORAGE_KEY,
  "shelf:reader-view-state",
  "shelf:last-read",
  "shelf:notebook-last-read",
  "shelf:explorer-pinned",
  "shelf:reading-stats",
  "shelf:reading-goal-minutes",
  "shelf:spotify-url",
  "shelf:spotify-recent",
  "shelf:pdf-night-mode",
  "shelf:study-ai-open-default-v1",
  "shelf:fullscreen-study-ai-width",
] as const;

const LAST_USER_KEY = "shelf:last-user-id";
const ACCOUNT_KEY_PREFIX = "shelf:";
const AUTH_KEYS = ["token", "user"] as const;
/** Device appearance only — not tied to an account. */
const KEEP_LOCAL_KEYS = new Set(["theme"]);

export function getStoredUserId(): string | null {
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

function collectKeys(storage: Storage, shouldRemove: (key: string) => boolean) {
  const toRemove: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && shouldRemove(key)) toRemove.push(key);
  }
  return toRemove;
}

function wipeLocalAccountKeys() {
  const toRemove = collectKeys(localStorage, (key) => {
    if (KEEP_LOCAL_KEYS.has(key)) return false;
    if (AUTH_KEYS.includes(key as (typeof AUTH_KEYS)[number])) return true;
    return key.startsWith(ACCOUNT_KEY_PREFIX);
  });
  for (const key of toRemove) localStorage.removeItem(key);
}

function wipeSessionAccountKeys() {
  if (typeof sessionStorage === "undefined") return;
  const toRemove = collectKeys(sessionStorage, (key) =>
    key.startsWith(ACCOUNT_KEY_PREFIX)
  );
  for (const key of toRemove) sessionStorage.removeItem(key);
}

/** Wipe all account-scoped browser state (tabs, streak, PDFs, Study AI, auth). */
export function clearAccountLocalState(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  try {
    wipeLocalAccountKeys();
    wipeSessionAccountKeys();
    window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
    window.dispatchEvent(new Event("shelf:reading-stats-changed"));
    window.dispatchEvent(new Event("shelf:reading-goal-changed"));
  } catch {
    /* ignore */
  }
  return clearPdfByteCache()
    .then(() => clearPdfDeleteUndos())
    .then(() => clearOfflineDb());
}

/**
 * Call after auth succeeds. If this browser was used by a different account
 * (or an unknown leftover session), drop their local data before continuing.
 */
export function bindAccountLocalState(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const prev =
      localStorage.getItem(LAST_USER_KEY) ?? getStoredUserId();
    if (prev !== userId) {
      void clearAccountLocalState();
    } else {
      adoptUnkeyedReadingStats(userId);
    }
    localStorage.setItem(LAST_USER_KEY, userId);
    window.dispatchEvent(new Event("shelf:reading-stats-changed"));
  } catch {
    /* ignore */
  }
}
