import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { otelAttributes, otelExportEnabled } from "./utils/otelBridge.js";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const OTEL_SEVERITY: Record<LogLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
};

function minLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? process.env.INGEST_LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") return raw;
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevel()];
}

function emitOtel(level: LogLevel, event: string, fields?: Record<string, unknown>): void {
  if (!otelExportEnabled()) return;

  logs
    .getLogger(process.env.SERVICE_NAME ?? "ingestion-service")
    .emit({
      severityNumber: OTEL_SEVERITY[level],
      severityText: level.toUpperCase(),
      body: event,
      attributes: otelAttributes(fields),
    });
}

function emit(level: LogLevel, event: string, fields?: Record<string, unknown>): void {
  if (!shouldLog(level)) return;
  const payload = {
    ts: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME ?? "ingestion-service",
    event,
    ...fields,
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);

  emitOtel(level, event, fields);
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => emit("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};

export function logConfigSummary(): void {
  log.info("ingest.config.summary", {
    mode: process.env.INGEST_WORKER_MODE ?? "sqs",
    backendUrl: process.env.BACKEND_URL ?? "http://localhost:4000",
    internalSecret: Boolean(process.env.INTERNAL_SECRET),
    awsRegion: process.env.AWS_REGION ?? null,
    awsKeys: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    pollQueue: Boolean(process.env.INGEST_SQS_POLL_QUEUE_URL),
    fetchQueue: Boolean(process.env.INGEST_SQS_FETCH_QUEUE_URL),
    processQueue: Boolean(process.env.INGEST_SQS_PROCESS_QUEUE_URL),
    promoteQueue: Boolean(process.env.INGEST_SQS_PROMOTE_QUEUE_URL),
    archiveQueue: Boolean(process.env.INGEST_SQS_ARCHIVE_QUEUE_URL),
    waitSeconds: process.env.INGEST_SQS_WAIT_SECONDS ?? "20",
    visibilityTimeout: process.env.INGEST_SQS_VISIBILITY_TIMEOUT ?? "300",
    logLevel: minLevel(),
    otel: otelExportEnabled(),
  });
}
