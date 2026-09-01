import { fetchWithRetry } from "./fetchRetry.js";

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
  const res = await fetchWithRetry(backendUrl(path), {
    method: "POST",
    headers: internalHeaders(),
    body: JSON.stringify(body),
    timeoutMs: 120_000,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ingest API ${path} failed (${res.status}): ${text.slice(0, 500)}`);
  }
}

export async function fetchDueSources(): Promise<{ id: string; slug: string }[]> {
  const res = await fetchWithRetry(backendUrl("/api/internal/ingest/due-sources"), {
    headers: internalHeaders(),
    timeoutMs: 30_000,
  });
  if (!res.ok) throw new Error(`due-sources failed (${res.status})`);
  const data = (await res.json()) as { sources: { id: string; slug: string }[] };
  return data.sources ?? [];
}

export async function dispatchIngestMessage(msg: {
  phase: string;
  sourceId?: string;
  itemId?: string;
  jobId?: string;
}): Promise<void> {
  const body = { jobId: msg.jobId };
  switch (msg.phase) {
    case "POLL":
      if (!msg.sourceId) throw new Error("POLL missing sourceId");
      await postIngest(`/api/internal/ingest/poll/${msg.sourceId}`, body);
      break;
    case "FETCH":
      if (!msg.itemId) throw new Error("FETCH missing itemId");
      await postIngest(`/api/internal/ingest/fetch/${msg.itemId}`, body);
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
}
