import "dotenv/config";
// Shelf API entrypoint
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import subjectRoutes from "./routes/subjects.js";
import highlightRoutes from "./routes/highlights.js";
import progressRoutes from "./routes/progress.js";
import adminRoutes from "./routes/admin.js";
import internalRoutes from "./routes/internal.js";
import subscriptionRoutes from "./routes/subscription.js";
import blogRoutes from "./routes/blog.js";
import adminBlogRoutes from "./routes/adminBlog.js";
import myContentRoutes from "./routes/myContent.js";
import myContentPdfReplaceRoutes from "./routes/myContentPdfReplace.js";
import studyRoutes from "./routes/study.js";
import studyChatRoutes from "./routes/studyChats.js";
import studyChatMessageRoutes from "./routes/studyChatMessages.js";
import studyRelevancyRoutes from "./routes/studyRelevancy.js";
import taskRoutes from "./routes/tasks.js";
import { requestContext } from "./middleware/requestContext.js";
import { logger } from "./utils/logger.js";
import { metrics } from "./utils/metrics.js";
import { errorFields } from "./utils/logger.js";
import { startVectorIndexWorker } from "./services/vectorIndexWorker.js";
import { isVectorConfigured, vectorConfigSummary } from "./services/vectorStore.js";
import { logEmbeddingConfig } from "./services/embeddings.js";
import { llmConfigSummary } from "./services/llmConfig.js";
import { ensureBucketCors } from "./services/s3.js";

process.env.SERVICE_NAME = process.env.SERVICE_NAME ?? "backend";

const app = express();
const PORT = process.env.PORT ?? 4000;
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

logger.info("cors.config", {
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "(default http://localhost:3000)",
  allowedOrigins: corsOrigins,
});

app.use((req, _res, next) => {
  const origin = req.headers.origin as string | undefined;
  const preflightOrigin = req.headers["access-control-request-origin"] as
    | string
    | undefined;

  if (origin || preflightOrigin || req.method === "OPTIONS") {
    const checkOrigin = origin ?? preflightOrigin;
    logger.info("cors.request", {
      CORS_ORIGIN: process.env.CORS_ORIGIN ?? "(default http://localhost:3000)",
      allowedOrigins: corsOrigins,
      requestOrigin: checkOrigin ?? null,
      allowed: checkOrigin ? corsOrigins.includes(checkOrigin) : null,
      method: req.method,
      path: req.originalUrl,
    });
  }

  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, server-to-server) often send no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        logger.info("cors.allowed", {
          requestOrigin: origin,
          allowedOrigins: corsOrigins,
        });
        callback(null, true);
        return;
      }
      logger.info("cors.rejected", {
        requestOrigin: origin,
        CORS_ORIGIN: process.env.CORS_ORIGIN ?? "(default http://localhost:3000)",
        allowedOrigins: corsOrigins,
      });
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type", "Range"],
    exposedHeaders: [
      "Accept-Ranges",
      "Content-Range",
      "Content-Length",
      "Content-Type",
    ],
  })
);
app.set("etag", false);
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(requestContext);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: process.env.SERVICE_NAME,
    uptimeSec: metrics.snapshot().uptimeSec,
  });
});

app.get("/metrics", (_req, res) => {
  res.json({
    service: process.env.SERVICE_NAME,
    ...metrics.snapshot(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/highlights", highlightRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/blog", adminBlogRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/my-content", myContentRoutes);
app.use("/api/my-content", myContentPdfReplaceRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/study", studyChatRoutes);
app.use("/api/study", studyChatMessageRoutes);
app.use("/api/study", studyRelevancyRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/internal", internalRoutes);

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    metrics.inc("unhandled_errors_total");
    (req.log ?? logger).error("http.unhandled_error", errorFields(err));
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

app.listen(PORT, () => {
  logger.info("server.started", {
    port: Number(PORT),
    logLevel: process.env.LOG_LEVEL ?? "info",
    corsOrigins,
  });
  logger.info("llm.config", llmConfigSummary());
  logEmbeddingConfig();
  logger.info("vector.config", vectorConfigSummary());
  void ensureBucketCors()
    .then(() => logger.info("s3.cors.ok"))
    .catch((err) =>
      logger.warn("s3.cors.failed", {
        hint: "Set bucket CORS for browser PUTs (MinIO/R2).",
        ...errorFields(err),
      })
    );
  if (isVectorConfigured()) {
    startVectorIndexWorker();
  }
});
