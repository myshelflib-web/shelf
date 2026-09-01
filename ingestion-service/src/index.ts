import "dotenv/config";
import express from "express";
import { sqsConfigured, startSqsWorkers } from "./sqsWorkers.js";
import { startLocalPollWorker } from "./localPollWorker.js";

process.env.SERVICE_NAME = process.env.SERVICE_NAME ?? "ingestion-service";

const app = express();
const PORT = process.env.PORT ?? 4002;
const mode = process.env.INGEST_WORKER_MODE ?? "sqs";

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: process.env.SERVICE_NAME,
    mode,
    sqs: sqsConfigured(),
  });
});

app.listen(PORT, () => {
  console.log("ingestion-service.started", { port: PORT, mode, sqs: sqsConfigured() });

  if (mode === "poll" || !sqsConfigured()) {
    startLocalPollWorker();
  }
  if (mode !== "poll" && sqsConfigured()) {
    startSqsWorkers();
  }
});
