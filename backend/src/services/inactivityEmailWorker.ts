import prisma from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { errorFields } from "../utils/logger.js";
import { isEmailConfigured } from "./email/config.js";
import { enqueueEmail, isEmailSqsConfigured } from "./email/emailQueue.js";
import { inactivityReminderEmail } from "./email/inactivityReminder.js";
import { sendEmail } from "./email/sendEmail.js";
import { isTelegramPlaceholderEmail } from "./telegramAuth.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_INACTIVE_MS = 7 * DAY_MS;
const DEFAULT_COOLDOWN_MS = 7 * DAY_MS;
const DEFAULT_INTERVAL_MS = DAY_MS;
const DEFAULT_START_DELAY_MS = 5 * 60 * 1000;
const DEFAULT_BATCH = 40;

let timer: ReturnType<typeof setInterval> | null = null;
let startTimer: ReturnType<typeof setTimeout> | null = null;
let running = false;

function envNum(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function inactiveThresholdMs(): number {
  return envNum("INACTIVITY_EMAIL_AFTER_MS", DEFAULT_INACTIVE_MS);
}

function cooldownMs(): number {
  return envNum("INACTIVITY_EMAIL_COOLDOWN_MS", DEFAULT_COOLDOWN_MS);
}

function batchLimit(): number {
  return Math.min(200, Math.floor(envNum("INACTIVITY_EMAIL_BATCH", DEFAULT_BATCH)));
}

function isLocalDevEmail(email: string): boolean {
  return email.endsWith("@shelf.local") || email.endsWith(".shelf.local");
}

export function isInactivityEmailCandidate(email: string): boolean {
  if (!email.includes("@")) return false;
  if (isTelegramPlaceholderEmail(email)) return false;
  if (isLocalDevEmail(email)) return false;
  return true;
}

export type InactivityEmailCandidate = {
  id: string;
  email: string;
  name: string;
};

/** Users inactive longer than the threshold who are due for another nudge. */
export async function findInactiveUsersForReminder(
  limit = batchLimit(),
  now = new Date()
): Promise<InactivityEmailCandidate[]> {
  const inactiveBefore = new Date(now.getTime() - inactiveThresholdMs());
  const cooldownBefore = new Date(now.getTime() - cooldownMs());

  const rows = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      lastActiveAt: { lt: inactiveBefore },
      OR: [
        { lastInactivityEmailAt: null },
        { lastInactivityEmailAt: { lt: cooldownBefore } },
      ],
    },
    select: { id: true, email: true, name: true },
    orderBy: { lastActiveAt: "asc" },
    take: Math.max(limit * 3, limit),
  });

  return rows.filter((u) => isInactivityEmailCandidate(u.email)).slice(0, limit);
}

async function sendReminderInline(
  user: InactivityEmailCandidate,
  now: Date
): Promise<void> {
  const payload = inactivityReminderEmail({
    name: user.name,
    userId: user.id,
    now,
  });

  await sendEmail({
    to: user.email,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    meta: { purpose: "inactivity_reminder", userId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastInactivityEmailAt: now },
  });

  logger.info("inactivity_email.sent", {
    userId: user.id,
    variantId: payload.variantId,
    via: "inline",
  });
}

/**
 * Prefer parking on EMAIL_SQS_QUEUE_URL; claim cooldown after enqueue so the
 * daily ticker does not double-queue while the worker catches up.
 */
async function enqueueOrSendReminder(
  user: InactivityEmailCandidate,
  now: Date
): Promise<"enqueued" | "sent"> {
  if (isEmailSqsConfigured()) {
    await enqueueEmail({
      type: "inactivity_reminder",
      userId: user.id,
      to: user.email,
      name: user.name,
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { lastInactivityEmailAt: now },
    });
    logger.info("inactivity_email.enqueued", { userId: user.id });
    return "enqueued";
  }

  await sendReminderInline(user, now);
  return "sent";
}

export async function runInactivityEmailBatch(now = new Date()): Promise<number> {
  if (!isEmailConfigured() && !isEmailSqsConfigured()) {
    logger.debug("inactivity_email.skip", { reason: "email_not_configured" });
    return 0;
  }
  if (!isEmailConfigured() && isEmailSqsConfigured()) {
    // Queue may still accept work; worker needs Resend to deliver.
    logger.warn("inactivity_email.enqueue_without_resend", {
      hint: "Set RESEND_API_KEY + EMAIL_FROM on the worker process",
    });
  }

  const candidates = await findInactiveUsersForReminder(batchLimit(), now);
  if (candidates.length === 0) {
    logger.debug("inactivity_email.none_due");
    return 0;
  }

  let handled = 0;
  for (const user of candidates) {
    try {
      await enqueueOrSendReminder(user, now);
      handled += 1;
    } catch (err) {
      logger.warn("inactivity_email.user_failed", {
        userId: user.id,
        ...errorFields(err),
      });
    }
  }

  logger.info("inactivity_email.batch_done", {
    candidates: candidates.length,
    handled,
    via: isEmailSqsConfigured() ? "sqs" : "inline",
  });
  return handled;
}

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    await runInactivityEmailBatch();
  } catch (err) {
    logger.error("inactivity_email.tick_failed", errorFields(err));
  } finally {
    running = false;
  }
}

/**
 * Daily ticker: find inactive students and park/send reminder emails.
 * Delivery uses EMAIL_SQS_QUEUE_URL when set; otherwise sends inline.
 */
export function startInactivityEmailWorker(): void {
  if (process.env.INACTIVITY_EMAIL_WORKER === "false") return;
  if (!isEmailConfigured() && !isEmailSqsConfigured()) {
    logger.info("inactivity_email.worker_skipped", { reason: "email_not_configured" });
    return;
  }
  if (timer || startTimer) return;

  const intervalMs = envNum("INACTIVITY_EMAIL_INTERVAL_MS", DEFAULT_INTERVAL_MS);
  const startDelayMs = envNum("INACTIVITY_EMAIL_START_DELAY_MS", DEFAULT_START_DELAY_MS);

  logger.info("inactivity_email.worker_started", {
    intervalMs,
    startDelayMs,
    inactiveAfterMs: inactiveThresholdMs(),
    cooldownMs: cooldownMs(),
    batch: batchLimit(),
    delivery: isEmailSqsConfigured() ? "sqs" : "inline",
  });

  startTimer = setTimeout(() => {
    startTimer = null;
    void tick();
    timer = setInterval(() => {
      void tick();
    }, intervalMs);
  }, startDelayMs);
}

export function stopInactivityEmailWorker(): void {
  if (startTimer) {
    clearTimeout(startTimer);
    startTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
