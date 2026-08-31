import "dotenv/config";
// Shelf PDF processing worker entrypoint
import express from "express";
import { requestContext } from "./middleware/requestContext.js";
import {
  enqueueJob,
  getInFlightCount,
  pollAndProcess,
  startWorker,
} from "./worker.js";
import { errorFields, logger } from "./utils/logger.js";
import { metrics } from "./utils/metrics.js";

process.env.SERVICE_NAME = process.env.SERVICE_NAME ?? "processing-service";

const app = express();
const PORT = process.env.PORT ?? 4001;

app.use(express.json());
app.use(requestContext);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    mode: "async-worker",
    service: process.env.SERVICE_NAME,
    uptimeSec: metrics.snapshot().uptimeSec,
    inFlight: getInFlightCount(),
  });
});

app.get("/metrics", (_req, res) => {
  res.json({
    service: process.env.SERVICE_NAME,
    inFlight: getInFlightCount(),
    ...metrics.snapshot(),
  });
});

app.post("/process", async (req, res) => {
  const log = req.log!;
  const { topicId, pdfKey, subjectSlug, topicSlug, type, userId, articleSlug } =
    req.body;

  if (!topicId || !pdfKey || !subjectSlug || !topicSlug) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const job = {
    type: (type === "user" ? "user" : "admin") as "admin" | "user",
    topicId,
    pdfKey,
    subjectSlug,
    topicSlug,
    articleSlug,
    userId,
  };

  metrics.inc("manual_process_requests_total");
  log.info("manual.process.queued", {
    topicId,
    type: job.type,
    pdfKey,
    userId: userId ?? null,
  });

  res.json({ status: "queued", topicId });

  enqueueJob(job).catch((err) =>
    log.error("manual.process.failed", {
      topicId,
      ...errorFields(err),
    })
  );
});

app.post("/poll", async (req, res) => {
  const log = req.log!;
  try {
    await pollAndProcess();
    log.info("manual.poll.ok", { inFlight: getInFlightCount() });
    res.json({ status: "polled", inFlight: getInFlightCount() });
  } catch (err) {
    log.error("manual.poll.failed", errorFields(err));
    res.status(500).json({ error: "Poll failed" });
  }
});

app.listen(PORT, () => {
  logger.info("server.started", {
    port: Number(PORT),
    logLevel: process.env.LOG_LEVEL ?? "info",
  });
  startWorker();
});
