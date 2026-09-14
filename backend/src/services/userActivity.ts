import prisma from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { errorFields } from "../utils/logger.js";

/** At most one DB write per user in this window (process-local). */
const TOUCH_THROTTLE_MS = 60 * 60 * 1000;
const lastTouchMs = new Map<string, number>();
const MAX_TRACKED = 20_000;

/**
 * Fire-and-forget: bump `User.lastActiveAt` for authenticated traffic.
 * Throttled so high-traffic readers do not write on every request.
 */
export function touchLastActive(userId: string): void {
  if (!userId) return;
  const now = Date.now();
  const prev = lastTouchMs.get(userId) ?? 0;
  if (now - prev < TOUCH_THROTTLE_MS) return;

  lastTouchMs.set(userId, now);
  if (lastTouchMs.size > MAX_TRACKED) {
    const cutoff = now - TOUCH_THROTTLE_MS;
    for (const [id, ts] of lastTouchMs) {
      if (ts < cutoff) lastTouchMs.delete(id);
    }
  }

  void prisma.user
    .update({
      where: { id: userId },
      data: { lastActiveAt: new Date(now) },
    })
    .catch((err) => {
      lastTouchMs.delete(userId);
      logger.debug("user_activity.touch_failed", {
        userId,
        ...errorFields(err),
      });
    });
}

/** Force an activity bump (login / signup) — skips throttle. */
export function markUserActiveNow(userId: string): void {
  if (!userId) return;
  const now = Date.now();
  lastTouchMs.set(userId, now);
  void prisma.user
    .update({
      where: { id: userId },
      data: { lastActiveAt: new Date(now) },
    })
    .catch((err) => {
      logger.debug("user_activity.mark_failed", {
        userId,
        ...errorFields(err),
      });
    });
}
