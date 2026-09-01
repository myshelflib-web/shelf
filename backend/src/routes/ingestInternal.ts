import { Router, Request, Response } from "express";
import { param } from "../utils/param.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.js";
import { pollIngestSource } from "../services/ingest/pollSource.js";
import { fetchIngestItem } from "../services/ingest/fetchItem.js";
import { processIngestItem } from "../services/ingest/processItem.js";
import { promoteIngestItem } from "../services/ingest/promoteItem.js";
import { archiveSupersededForSource } from "../services/ingest/archiveEditions.js";
import {
  markJobCompleted,
  markJobFailed,
  markJobRunning,
} from "../services/ingest/ingestJobs.js";
import { findSourcesDueForPoll } from "../services/ingest/ingestScheduler.js";
import { logger, errorFields } from "../utils/logger.js";

const router = Router();
router.use(internalAuthMiddleware);

router.get("/ingest/due-sources", async (_req: Request, res: Response) => {
  const sources = await findSourcesDueForPoll(50);
  res.json({ sources });
});

router.post("/ingest/poll/:sourceId", async (req: Request, res: Response) => {
  const sourceId = param(req, "sourceId");
  const jobId = String(req.body?.jobId ?? "");
  try {
    if (jobId) await markJobRunning(jobId);
    const result = await pollIngestSource(sourceId);
    if (jobId) await markJobCompleted(jobId);
    res.json(result);
  } catch (err) {
    if (jobId) await markJobFailed(jobId, err instanceof Error ? err.message : String(err));
    (req.log ?? logger).error("internal.ingest.poll_failed", { sourceId, ...errorFields(err) });
    res.status(500).json({ error: err instanceof Error ? err.message : "Poll failed" });
  }
});

router.post("/ingest/fetch/:itemId", async (req: Request, res: Response) => {
  const itemId = param(req, "itemId");
  const jobId = String(req.body?.jobId ?? "");
  try {
    if (jobId) await markJobRunning(jobId);
    const result = await fetchIngestItem(itemId);
    if (jobId) await markJobCompleted(jobId);
    res.json(result);
  } catch (err) {
    if (jobId) await markJobFailed(jobId, err instanceof Error ? err.message : String(err));
    res.status(500).json({ error: err instanceof Error ? err.message : "Fetch failed" });
  }
});

router.post("/ingest/process/:itemId", async (req: Request, res: Response) => {
  const itemId = param(req, "itemId");
  const jobId = String(req.body?.jobId ?? "");
  try {
    if (jobId) await markJobRunning(jobId);
    const result = await processIngestItem(itemId);
    if (jobId) await markJobCompleted(jobId);
    res.json(result);
  } catch (err) {
    if (jobId) await markJobFailed(jobId, err instanceof Error ? err.message : String(err));
    res.status(500).json({ error: err instanceof Error ? err.message : "Process failed" });
  }
});

router.post("/ingest/promote/:itemId", async (req: Request, res: Response) => {
  const itemId = param(req, "itemId");
  const jobId = String(req.body?.jobId ?? "");
  try {
    if (jobId) await markJobRunning(jobId);
    const result = await promoteIngestItem(itemId);
    if (jobId) await markJobCompleted(jobId);
    res.json(result);
  } catch (err) {
    if (jobId) await markJobFailed(jobId, err instanceof Error ? err.message : String(err));
    res.status(500).json({ error: err instanceof Error ? err.message : "Promote failed" });
  }
});

router.post("/ingest/archive/:sourceId", async (req: Request, res: Response) => {
  const sourceId = param(req, "sourceId");
  const jobId = String(req.body?.jobId ?? "");
  try {
    if (jobId) await markJobRunning(jobId);
    const result = await archiveSupersededForSource(sourceId);
    if (jobId) await markJobCompleted(jobId);
    res.json(result);
  } catch (err) {
    if (jobId) await markJobFailed(jobId, err instanceof Error ? err.message : String(err));
    res.status(500).json({ error: err instanceof Error ? err.message : "Archive failed" });
  }
});

export default router;
