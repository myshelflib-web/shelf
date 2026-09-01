import "dotenv/config";
import express from "express";
import { startSqsWorkers, workerStats, sqsConfigured } from "./sqsWorkers.js";
import { startLocalPollWorker } from "./localPollWorker.js";
import { awsConfigured, queueStatus } from "./ingestConfig.js";
import { log, logConfigSummary } from "./logger.js";

process.env.SERVICE_NAME = process.env.SERVICE_NAME ?? "ingestion-service";

const app = express();
const PORT = process.env.PORT ?? 4002;
const mode = process.env.INGEST_WORKER_MODE ?? "sqs";

app.get("/health", async (_req, res) => {
  const queues = sqsConfigured() ? await queueStatus() : null;
  res.json({
    status: "ok",
    service: process.env.SERVICE_NAME,
    mode,
    sqs: sqsConfigured(),
    aws: awsConfigured(),
    backendUrl: process.env.BACKEND_URL ?? null,
    internalSecret: Boolean(process.env.INTERNAL_SECRET),
    worker: workerStats(),
    queues,
  });
});

app.listen(PORT, () => {
  logConfigSummary();
  log.info("ingestion-service.started", { port: PORT, mode, sqs: sqsConfigured() });

  if (mode === "poll" || !sqsConfigured()) {
    if (mode === "sqs" && !sqsConfigured()) {
      log.error("ingest.config.invalid", {
        hint: "Set AWS keys + all 5 queue URLs on this service (same as backend)",
      });
    }
    startLocalPollWorker();
  }
  if (mode !== "poll" && sqsConfigured()) {
    startSqsWorkers();
  }
});
