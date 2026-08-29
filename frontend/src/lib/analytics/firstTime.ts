import type { User } from "@/types";
import { track } from "./client";
import type { AnalyticsEventName } from "./events";

const PREFIX = "shelf:analytics:once:";

export function isFreshSignup(user: User): boolean {
  if (!user.createdAt) return false;
  const created = Date.parse(user.createdAt);
  return !Number.isNaN(created) && Date.now() - created < 120_000;
}

function onceKey(userId: string, flag: string): string {
  return `${PREFIX}${flag}:${userId}`;
}

export function trackOncePerUser(
  userId: string,
  flag: string,
  event: AnalyticsEventName,
  properties?: Record<string, string | number | boolean | null | undefined>
): boolean {
  if (typeof window === "undefined") return false;
  const key = onceKey(userId, flag);
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
  } catch {
    return false;
  }
  track(event, properties);
  return true;
}
