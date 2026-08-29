import type { User } from "@/types";

const COMPLETED_PREFIX = "shelf:onboarding-completed:";

/** Accounts older than this without a completion flag are treated as already onboarded. */
const LEGACY_CUTOFF_MS = 60 * 60 * 1000;

export function onboardingStorageKey(userId: string): string {
  return `${COMPLETED_PREFIX}${userId}`;
}

export function isOnboardingComplete(userId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(onboardingStorageKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingComplete(userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(onboardingStorageKey(userId), "1");
  } catch {
    /* ignore */
  }
}

/** True for brand-new accounts that have not finished or skipped onboarding. */
export function needsOnboarding(user: User | null | undefined): boolean {
  if (!user) return false;
  if (isOnboardingComplete(user.id)) return false;

  const createdAt = user.createdAt;
  if (createdAt) {
    const created = new Date(createdAt).getTime();
    if (!Number.isNaN(created) && Date.now() - created > LEGACY_CUTOFF_MS) {
      markOnboardingComplete(user.id);
      return false;
    }
  }

  return true;
}
