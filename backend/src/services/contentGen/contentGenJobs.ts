import type { ContentGenKind, ContentGenStatus, StudyGoal } from "@prisma/client";
import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { estimateCostPaise } from "../sarvam/sarvamPricing.js";
import { asNewsPlan, asStarterPlan, asVisualEnrichPlan, planJson, type ContentGenPlan } from "./jobPlan.js";
import { isAnyContentGenInFlight } from "./jobRegistry.js";
import { hasStarterDraft } from "./starterDraft.js";

export type CreateJobInput = {
  kind: ContentGenKind;
  studyGoal: StudyGoal;
  model: string;
  dryRun: boolean;
  withIllustrations?: boolean;
  plannedCount: number;
  requestedById?: string | null;
  plan: ContentGenPlan;
};

export async function createContentGenJob(input: CreateJobInput): Promise<string> {
  const job = await prisma.contentGenJob.create({
    data: {
      kind: input.kind,
      studyGoal: input.studyGoal,
      model: input.model,
      dryRun: input.dryRun,
      withIllustrations: input.withIllustrations !== false,
      plannedCount: input.plannedCount,
      requestedById: input.requestedById ?? null,
      plan: planJson(input.plan),
      cursor: 0,
    },
    select: { id: true },
  });
  return job.id;
}

export async function markJobRunning(jobId: string): Promise<void> {
  await prisma.contentGenJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      pausedReason: null,
      pausedAt: null,
      error: null,
    },
  });
}

/**
 * Parks a job mid-run because the provider stopped answering. Items already
 * marked RUNNING go back to QUEUED so the resume picks them up again.
 */
export async function pauseJob(jobId: string, reason: string): Promise<void> {
  await prisma.$transaction([
    prisma.contentGenItem.updateMany({
      where: { jobId, status: "RUNNING" },
      data: { status: "QUEUED" },
    }),
    prisma.contentGenJob.update({
      where: { id: jobId },
      data: {
        status: "PAUSED",
        pausedReason: reason.slice(0, 500),
        pausedAt: new Date(),
        resumeAttempts: { increment: 1 },
      },
    }),
  ]);
}

/** Items still to generate, in creation order, for a resumed or legacy job. */
export async function pendingItems(jobId: string) {
  return prisma.contentGenItem.findMany({
    where: { jobId, status: { in: ["QUEUED", "RUNNING"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      subjectSlug: true,
      topicSlug: true,
      payload: true,
    },
  });
}

export async function getJobRunState(jobId: string) {
  return prisma.contentGenJob.findUnique({
    where: { id: jobId },
    select: {
      cursor: true,
      plan: true,
      plannedCount: true,
      dryRun: true,
      withIllustrations: true,
      kind: true,
      studyGoal: true,
      status: true,
    },
  });
}

export async function listPausedJobs() {
  return prisma.contentGenJob.findMany({
    where: { status: { in: ["PAUSED", "RUNNING"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      kind: true,
      studyGoal: true,
      dryRun: true,
      resumeAttempts: true,
    },
  });
}

export async function remainingWorkCount(jobId: string): Promise<number> {
  const leftover = await prisma.contentGenItem.count({
    where: { jobId, status: { in: ["QUEUED", "RUNNING"] } },
  });
  if (leftover > 0) return leftover;

  const job = await prisma.contentGenJob.findUnique({
    where: { id: jobId },
    select: { cursor: true, plan: true },
  });
  if (!job) return 0;

  const starter = asStarterPlan(job.plan);
  if (starter) {
    const todo = starter.entries.slice(job.cursor);
    if (todo.length === 0) return 0;
    const done = await prisma.contentGenItem.findMany({
      where: { jobId, status: { in: ["COMPLETED", "FAILED", "SKIPPED"] } },
      select: { subjectSlug: true, slug: true },
    });
    const doneKeys = new Set(done.map((r) => `${r.subjectSlug}/${r.slug}`));
    return todo.filter((e) => !doneKeys.has(`${e.subjectSlug}/${e.slug}`)).length;
  }

  const news = asNewsPlan(job.plan);
  if (news) {
    const todo = news.clusters.slice(job.cursor);
    if (todo.length === 0) return 0;
    const done = await prisma.contentGenItem.findMany({
      where: { jobId, status: { in: ["COMPLETED", "FAILED", "SKIPPED"] } },
      select: { slug: true },
    });
    const doneSlugs = new Set(done.map((r) => r.slug));
    return todo.filter((c) => !doneSlugs.has(c.key)).length;
  }

  const visual = asVisualEnrichPlan(job.plan);
  if (visual) {
    const todo = visual.entries.slice(job.cursor);
    if (todo.length === 0) return 0;
    const done = await prisma.contentGenItem.findMany({
      where: { jobId, status: { in: ["COMPLETED", "FAILED", "SKIPPED"] } },
      select: { subjectSlug: true, slug: true },
    });
    const doneKeys = new Set(done.map((r) => `${r.subjectSlug}/${r.slug}`));
    return todo.filter((e) => !doneKeys.has(`${e.subjectSlug}/${e.slug}`)).length;
  }

  return 0;
}

/**
 * Last page already scored but the job row never left RUNNING — common after
 * a deploy or crash between recordItemOutcome and finishJob. Closes it.
 */
export async function completeJobIfIdle(jobId: string): Promise<boolean> {
  if ((await remainingWorkCount(jobId)) > 0) return false;
  const job = await prisma.contentGenJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (
    !job ||
    (job.status !== "QUEUED" &&
      job.status !== "RUNNING" &&
      job.status !== "PAUSED")
  ) {
    return false;
  }
  await finishJob(jobId, { status: "COMPLETED" });
  return true;
}

export async function finishJob(
  jobId: string,
  opts: { status: ContentGenStatus; error?: string | null }
): Promise<void> {
  const current = await prisma.contentGenJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (current?.status === "COMPLETED" || current?.status === "FAILED") return;

  await prisma.contentGenJob.update({
    where: { id: jobId },
    data: {
      status: opts.status,
      error: opts.error?.slice(0, 500) ?? null,
      finishedAt: new Date(),
      pausedReason: null,
      pausedAt: null,
      plan: Prisma.DbNull,
    },
  });
}

export type ItemOutcome = {
  status: ContentGenStatus;
  relevanceScore?: number | null;
  reviewNotes?: string | null;
  articleId?: string | null;
  wordCount?: number;
  inputTokens?: number;
  outputTokens?: number;
  error?: string | null;
  payload?: Prisma.InputJsonValue;
};

function persistNotes(
  status: ContentGenStatus,
  notes?: string | null
): string | null {
  if (!notes || status === "COMPLETED") return null;
  return notes.slice(0, 1500);
}

async function advanceJobCursor(jobId: string): Promise<void> {
  await prisma.contentGenJob.update({
    where: { id: jobId },
    data: { cursor: { increment: 1 } },
  });
}

export async function createRunningItem(
  jobId: string,
  data: { title: string; slug: string; subjectSlug: string; topicSlug: string }
): Promise<string> {
  const row = await prisma.contentGenItem.create({
    data: { jobId, ...data, status: "RUNNING" },
    select: { id: true },
  });
  return row.id;
}

/** Records one item result and rolls the totals up onto the parent job. */
export async function recordItemOutcome(
  jobId: string,
  itemId: string,
  outcome: ItemOutcome
): Promise<void> {
  const current = await prisma.contentGenItem.findUnique({
    where: { id: itemId },
    select: { status: true },
  });
  if (
    current &&
    (current.status === "COMPLETED" ||
      current.status === "FAILED" ||
      current.status === "SKIPPED")
  ) {
    return;
  }

  const inputTokens = outcome.inputTokens ?? 0;
  const outputTokens = outcome.outputTokens ?? 0;

  await prisma.contentGenItem.update({
    where: { id: itemId },
    data: {
      status: outcome.status,
      relevanceScore: outcome.relevanceScore ?? null,
      reviewNotes: persistNotes(outcome.status, outcome.reviewNotes),
      articleId: outcome.articleId ?? null,
      wordCount: outcome.wordCount ?? 0,
      inputTokens,
      outputTokens,
      error: outcome.error?.slice(0, 500) ?? null,
      ...(outcome.payload !== undefined ? { payload: outcome.payload } : {}),
    },
  });

  await prisma.contentGenJob.update({
    where: { id: jobId },
    data: {
      completedCount: outcome.status === "COMPLETED" ? { increment: 1 } : undefined,
      failedCount: outcome.status === "FAILED" ? { increment: 1 } : undefined,
      skippedCount: outcome.status === "SKIPPED" ? { increment: 1 } : undefined,
      inputTokens: { increment: inputTokens },
      outputTokens: { increment: outputTokens },
      costPaise: { increment: estimateCostPaise(inputTokens, outputTokens) },
    },
  });

  await advanceJobCursor(jobId);
}

export async function markItemRunning(itemId: string): Promise<void> {
  await prisma.contentGenItem.update({
    where: { id: itemId },
    data: { status: "RUNNING" },
  });
}

const JOB_HEADER_SELECT = {
  id: true,
  kind: true,
  status: true,
  studyGoal: true,
  model: true,
  dryRun: true,
  withIllustrations: true,
  plannedCount: true,
  completedCount: true,
  failedCount: true,
  skippedCount: true,
  inputTokens: true,
  outputTokens: true,
  costPaise: true,
  error: true,
  pausedReason: true,
  pausedAt: true,
  resumeAttempts: true,
  cursor: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
} as const;

export async function listContentGenJobs(limit = 20) {
  return prisma.contentGenJob.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
    select: JOB_HEADER_SELECT,
  });
}

export async function getContentGenJob(jobId: string) {
  return prisma.contentGenJob.findUnique({
    where: { id: jobId },
    select: JOB_HEADER_SELECT,
  });
}

export async function listContentGenItems(
  jobId: string,
  opts: { cursor?: string; limit?: number }
) {
  const take = Math.min(50, Math.max(1, opts.limit ?? 40));
  let cursorWhere: Prisma.ContentGenItemWhereInput = { jobId };

  if (opts.cursor) {
    const cur = await prisma.contentGenItem.findFirst({
      where: { id: opts.cursor, jobId },
      select: { id: true, createdAt: true },
    });
    if (cur) {
      cursorWhere = {
        jobId,
        OR: [
          { createdAt: { lt: cur.createdAt } },
          { createdAt: cur.createdAt, id: { lt: cur.id } },
        ],
      };
    }
  }

  const rows = await prisma.contentGenItem.findMany({
    where: cursorWhere,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: {
      id: true,
      title: true,
      slug: true,
      subjectSlug: true,
      topicSlug: true,
      status: true,
      relevanceScore: true,
      reviewNotes: true,
      articleId: true,
      wordCount: true,
      inputTokens: true,
      outputTokens: true,
      error: true,
      payload: true,
    },
  });

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;
  const items = sliced.map(({ payload, ...row }) => ({
    ...row,
    hasDraft: hasStarterDraft(payload),
  }));
  const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;
  return { items, nextCursor, hasMore };
}

export async function hasRunningJob(): Promise<boolean> {
  if (isAnyContentGenInFlight()) return true;
  const running = await prisma.contentGenJob.count({
    where: { status: { in: ["QUEUED", "RUNNING"] } },
  });
  return running > 0;
}

export async function skipOpenContentGenItems(
  jobId: string,
  reason: string
): Promise<void> {
  const { count } = await prisma.contentGenItem.updateMany({
    where: { jobId, status: { in: ["QUEUED", "RUNNING"] } },
    data: { status: "SKIPPED", error: reason.slice(0, 500) },
  });
  if (count > 0) {
    await prisma.contentGenJob.update({
      where: { id: jobId },
      data: {
        skippedCount: { increment: count },
        cursor: { increment: count },
      },
    });
  }
}

/** Failed or below-score page rows for a finished job — used to start a retry run. */
export async function listFailedContentGenItems(jobId: string) {
  return prisma.contentGenItem.findMany({
    where: { jobId, status: { in: ["FAILED", "SKIPPED"] } },
    orderBy: { createdAt: "asc" },
    select: {
      title: true,
      slug: true,
      subjectSlug: true,
      topicSlug: true,
      payload: true,
    },
  });
}
