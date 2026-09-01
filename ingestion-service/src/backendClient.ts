import { fetchWithRetry } from "./fetchRetry.js";
import { log } from "./logger.js";
import { metrics } from "./utils/metrics.js";

function internalHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.INTERNAL_SECRET) {
    headers["x-internal-secret"] = process.env.INTERNAL_SECRET;
  }
  return headers;
}

function backendUrl(path: string): string {
  const base = (process.env.BACKEND_URL ?? "http://localhost:4000").replace(/\/$/, "");
  return `${base}${path}`;
}

export async function postIngest(
  path: string,
  body: Record<string, unknown> = {}
): Promise<void> {
  const started = Date.now();
  log.debug("ingest.api.request", { path, bodyKeys: Object.keys(body) });

  const res = await fetchWithRetry(backendUrl(path), {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify(body),
    timeoutMs: 120_000,
  });

  const ms = Date.now() - started;
  if (!res.ok) {
    const text = await res.text();
    metrics.inc("ingest_api_requests_total", { path, ok: false, status: res.status });
    metrics.observe("ingest_api_duration_ms", ms, { path, ok: false });
    log.error("ingest.api.fail", {
      path,
      status: res.status,
      ms,
      bodyPreview: text.slice(0, 500),
    });
    throw new Error(`Ingest API ${path} failed (${res.status}): ${text.slice(0, 500)}`);
  }

  metrics.inc("ingest_api_requests_total", { path, ok: true, status: res.status });
  metrics.observe("ingest_api_duration_ms", ms, { path, ok: true });
  log.info("ingest.api.ok", { path, status: res.status, ms });
}

export async function fetchDueSources(): Promise<{ id: string; slug: string }[]> {
  const started = Date.now();
  const res = await fetchWithRetry(backendUrl("/api/internal/ingest/due-sources"), {
    headers: internalHeaders(),
    timeoutMs: 30_000,
  });
  if (!res.ok) {
    metrics.inc("ingest_api_requests_total", {
      path: "/api/internal/ingest/due-sources",
      ok: false,
      status: res.status,
    });
    metrics.observe("ingest_api_duration_ms", Date.now() - started, {
      path: "/api/internal/ingest/due-sources",
      ok: false,
    });
    log.error("ingest.due_sources.fail", { status: res.status, ms: Date.now() - started });
    throw new Error(`due-sources failed (${res.status})`);
  }
  const data = (await res.json()) as { sources: { id: string; slug: string }[] };
  const sources = data.sources ?? [];
  const ms = Date.now() - started;
  metrics.inc("ingest_api_requests_total", {
    path: "/api/internal/ingest/due-sources",
    ok: true,
    status: res.status,
  });
  metrics.observe("ingest_api_duration_ms", ms, {
    path: "/api/internal/ingest/due-sources",
    ok: true,
  });
  log.info("ingest.due_sources.ok", { count: sources.length, ms });
  return sources;
}

export async function dispatchIngestMessage(msg: {
  phase: string;
  sourceId?: string;
  itemId?: string;
  articleId?: string;
  jobId?: string;
}): Promise<void> {
  log.info("ingest.dispatch.start", {
    phase: msg.phase,
    sourceId: msg.sourceId ?? null,
    itemId: msg.itemId ?? null,
    jobId: msg.jobId ?? null,
  });

  const body = { jobId: msg.jobId };
  switch (msg.phase) {
    case "POLL":
      if (!msg.sourceId) throw new Error("POLL missing sourceId");
      await postIngest(`/api/internal/ingest/poll/${msg.sourceId}`, body);
      break;
    case "FETCH":
      if (msg.articleId) {
        await postIngest(`/api/internal/preloaded/mirror/${msg.articleId}`, body);
      } else if (msg.itemId) {
        await postIngest(`/api/internal/ingest/fetch/${msg.itemId}`, body);
      } else {
        throw new Error("FETCH missing itemId or articleId");
      }
      break;
    case "PROCESS":
      if (!msg.itemId) throw new Error("PROCESS missing itemId");
      await postIngest(`/api/internal/ingest/process/${msg.itemId}`, body);
      break;
    case "PROMOTE":
      if (!msg.itemId) throw new Error("PROMOTE missing itemId");
      await postIngest(`/api/internal/ingest/promote/${msg.itemId}`, body);
      break;
    case "ARCHIVE":
      if (!msg.sourceId) throw new Error("ARCHIVE missing sourceId");
      await postIngest(`/api/internal/ingest/archive/${msg.sourceId}`, body);
      break;
    default:
      throw new Error(`Unknown phase: ${msg.phase}`);
  }

  log.info("ingest.dispatch.ok", { phase: msg.phase });
}
