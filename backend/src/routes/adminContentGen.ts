import { Router, Request, Response } from "express";
import type { StudyGoal } from "@prisma/client";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { isStudyGoal } from "../studyGoal.js";
import { param } from "../utils/param.js";
import {
  getContentGenJob,
  hasRunningJob,
  listContentGenItems,
  listContentGenJobs,
} from "../services/contentGen/contentGenJobs.js";
import { scheduleContentGenPrune } from "../services/contentGen/pruneContentGen.js";
import {
  bytesForPages,
  costPaiseForPages,
  pricingRates,
} from "../services/contentGen/costStorage.js";
import { generationModelLabel } from "../services/contentGen/generationChat.js";
import { retryFailedContentGenJob } from "../services/contentGen/retryFailed.js";
import { resumeContentGenJob } from "../services/contentGen/resumeJobs.js";
import { stopContentGenJob } from "../services/contentGen/stopJob.js";
import { startStarterPackJob } from "../services/contentGen/runStarterPack.js";
import { catalogHasSubject, catalogPacks } from "../services/contentGen/syllabus/index.js";
import {
  planNewsPack,
  startNewsPackJob,
} from "../services/contentGen/news/runNewsPack.js";
import { sarvamConfigSummary } from "../services/sarvam/sarvamConfig.js";

const router = Router();

router.use("/content-gen", authMiddleware, adminMiddleware);

router.get("/content-gen/overview", async (_req: Request, res: Response) => {
  scheduleContentGenPrune();
  const sarvam = sarvamConfigSummary();
  const rates = pricingRates();
  const packs = catalogPacks();
  const totalPages = packs.reduce((sum, p) => sum + p.articleCount, 0);

  res.json({
    provider: {
      configured: sarvam.configured,
      model: generationModelLabel(),
      baseUrl: sarvam.baseUrl,
      inputInrPerMtok: rates.inputInrPerMtok,
      outputInrPerMtok: rates.outputInrPerMtok,
    },
    packs,
    totalPages,
    estimatedCostPaise: costPaiseForPages(totalPages),
    estimatedBytes: bytesForPages(totalPages),
    perPageCostPaise: rates.perPageCostPaise,
    perPageBytes: rates.bytesPerPage,
    tokensPerPage: rates.tokensPerPage,
    pipeline:
      "syllabus leaf → draft → coverage/fact/filler recheck → revise → publish; pauses on API outage",
    busy: await hasRunningJob(),
  });
});

router.get("/content-gen/jobs", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit ?? 20);
  const jobs = await listContentGenJobs(Number.isFinite(limit) ? limit : 20);
  res.json({ jobs });
});

router.get("/content-gen/jobs/:id", async (req: Request, res: Response) => {
  const job = await getContentGenJob(param(req, "id"));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({ job });
});

router.get("/content-gen/jobs/:id/items", async (req: Request, res: Response) => {
  const jobId = param(req, "id");
  const job = await getContentGenJob(jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const limit = Number(req.query.limit ?? 40);
  const cursor =
    typeof req.query.cursor === "string" && req.query.cursor
      ? req.query.cursor
      : undefined;
  const page = await listContentGenItems(jobId, {
    cursor,
    limit: Number.isFinite(limit) ? limit : 40,
  });
  res.json(page);
});

router.post("/content-gen/jobs/:id/resume", async (req: Request, res: Response) => {
  try {
    await resumeContentGenJob(param(req, "id"));
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not resume this job",
    });
  }
});

router.post("/content-gen/jobs/:id/retry-failed", async (req: Request, res: Response) => {
  try {
    const result = await retryFailedContentGenJob(
      param(req, "id"),
      req.user?.userId ?? null
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not retry failed pages";
    res.status(message.includes("already running") ? 409 : 400).json({ error: message });
  }
});

router.post("/content-gen/jobs/:id/stop", async (req: Request, res: Response) => {
  try {
    await stopContentGenJob(param(req, "id"));
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not stop this job",
    });
  }
});

function readGoal(req: Request, res: Response): StudyGoal | null {
  const goal: unknown = req.body?.studyGoal;
  if (!isStudyGoal(goal)) {
    res.status(400).json({ error: "Valid studyGoal is required" });
    return null;
  }
  return goal;
}

function readLimit(value: unknown, max: number): number | undefined {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(max, Math.floor(n));
}

function readSubjectSlug(value: unknown, goal: StudyGoal): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const slug = value.trim();
  const known = catalogHasSubject(goal, slug);
  return known ? slug : undefined;
}

router.post("/content-gen/starter-pack", async (req: Request, res: Response) => {
  const goal = readGoal(req, res);
  if (!goal) return;

  if (await hasRunningJob()) {
    res.status(409).json({ error: "A generation job is already running" });
    return;
  }

  const subjectSlug = readSubjectSlug(req.body?.subjectSlug, goal);
  if (typeof req.body?.subjectSlug === "string" && req.body.subjectSlug.trim() && !subjectSlug) {
    res.status(400).json({ error: "Unknown subjectSlug for this study goal" });
    return;
  }

  try {
    const result = await startStarterPackJob({
      studyGoal: goal,
      subjectSlug,
      limit: readLimit(req.body?.limit, 2000),
      dryRun: req.body?.dryRun === true,
      skipExisting: req.body?.skipExisting !== false,
      requestedById: req.user?.userId ?? null,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not start generation",
    });
  }
});

router.post("/content-gen/news/plan", async (req: Request, res: Response) => {
  const goal = readGoal(req, res);
  if (!goal) return;

  const plan = await planNewsPack({
    studyGoal: goal,
    limit: readLimit(req.body?.limit, 25),
    windowDays: readLimit(req.body?.windowDays, 60),
    minSources: readLimit(req.body?.minSources, 5),
  });

  res.json({
    totalItems: plan.totalItems,
    clusters: plan.clusters.map((c) => ({
      key: c.key,
      leadTitle: c.leadTitle,
      sourceCount: c.sourceCount,
      sources: [...new Set(c.items.map((i) => i.sourceName))],
    })),
  });
});

router.post("/content-gen/news", async (req: Request, res: Response) => {
  const goal = readGoal(req, res);
  if (!goal) return;

  if (await hasRunningJob()) {
    res.status(409).json({ error: "A generation job is already running" });
    return;
  }

  try {
    const result = await startNewsPackJob({
      studyGoal: goal,
      limit: readLimit(req.body?.limit, 25),
      windowDays: readLimit(req.body?.windowDays, 60),
      minSources: readLimit(req.body?.minSources, 5),
      dryRun: req.body?.dryRun === true,
      requestedById: req.user?.userId ?? null,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Could not start generation",
    });
  }
});

export default router;
