import { createHash } from "crypto";
import { logger } from "../utils/logger.js";
import { fetchWithTimeout } from "../utils/timeout.js";

export function isVectorConfigured(): boolean {
  return Boolean(process.env.VECTOR_DB_URL?.trim());
}

export type VectorPayload = {
  userId: string;
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  text: string;
  chunkIndex: number;
};

export type VectorHit = {
  score: number;
  payload: VectorPayload;
};

function baseUrl() {
  return (process.env.VECTOR_DB_URL ?? "").replace(/\/+$/, "");
}

function collection() {
  return process.env.VECTOR_DB_COLLECTION ?? "shelf-library";
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.VECTOR_DB_API_KEY?.trim();
  if (key) {
    h["api-key"] = key;
    h.Authorization = `Bearer ${key}`;
  }
  return h;
}

/** Deterministic UUID for a page chunk (Qdrant point id). */
export function chunkPointId(pageId: string, chunkIndex: number): string {
  const hex = createHash("sha1").update(`${pageId}:${chunkIndex}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function qdrant(path: string, init: RequestInit): Promise<Response> {
  const timeoutMs = Number(process.env.VECTOR_DB_TIMEOUT_MS ?? 20_000);
  return fetchWithTimeout(`${baseUrl()}${path}`, {
    ...init,
    timeoutMs,
    headers: { ...headers(), ...(init.headers as Record<string, string> | undefined) },
  });
}

let ensured = false;
let indexesEnsured = false;

/** Qdrant Cloud requires keyword indexes for filtered delete/search. */
async function ensurePayloadIndexes(): Promise<void> {
  if (indexesEnsured || !isVectorConfigured()) return;
  const name = collection();
  for (const field of ["pageId", "userId"] as const) {
    const res = await qdrant(`/collections/${name}/index`, {
      method: "PUT",
      body: JSON.stringify({
        field_name: field,
        field_schema: "keyword",
      }),
    });
    if (res.ok || res.status === 409) continue;
    const body = await res.text().catch(() => "");
    // Already exists often returns 400 with a message — treat as ok if so.
    if (/already exists|exists/i.test(body)) continue;
    logger.warn("vector.payload_index_failed", {
      field,
      status: res.status,
      body: body.slice(0, 200),
    });
  }
  indexesEnsured = true;
}

async function ensureCollection(vectorSize: number): Promise<void> {
  if (!isVectorConfigured()) return;
  const name = collection();

  if (!ensured) {
    const existing = await qdrant(`/collections/${name}`, { method: "GET" });
    if (!existing.ok) {
      const create = await qdrant(`/collections/${name}`, {
        method: "PUT",
        body: JSON.stringify({
          vectors: { size: vectorSize, distance: "Cosine" },
        }),
      });
      if (!create.ok && create.status !== 409) {
        const body = await create.text().catch(() => "");
        logger.error("vector.collection.create_failed", {
          status: create.status,
          body: body.slice(0, 300),
        });
        return;
      }
    }
    ensured = true;
  }

  await ensurePayloadIndexes();
}

export async function upsertVectors(
  points: { id: string; vector: number[]; payload: VectorPayload }[]
): Promise<void> {
  if (!isVectorConfigured() || points.length === 0) return;
  await ensureCollection(points[0].vector.length);
  const res = await qdrant(`/collections/${collection()}/points?wait=true`, {
    method: "PUT",
    body: JSON.stringify({
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Vector upsert failed (${res.status}): ${body.slice(0, 200)}`);
  }
}

export async function searchVectors(
  vector: number[],
  userId: string,
  limit = 8,
  opts?: { pageId?: string; pageIds?: string[] }
): Promise<VectorHit[]> {
  if (!isVectorConfigured()) return [];
  await ensureCollection(vector.length);
  const must: Array<Record<string, unknown>> = [
    { key: "userId", match: { value: userId } },
  ];
  if (opts?.pageId) {
    must.push({ key: "pageId", match: { value: opts.pageId } });
  } else if (opts?.pageIds && opts.pageIds.length > 0) {
    must.push({ key: "pageId", match: { any: opts.pageIds } });
  } else if (opts?.pageIds && opts.pageIds.length === 0) {
    return [];
  }
  const res = await qdrant(`/collections/${collection()}/points/search`, {
    method: "POST",
    body: JSON.stringify({
      vector,
      limit,
      with_payload: true,
      filter: { must },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error("vector.search_failed", { status: res.status, body: body.slice(0, 300) });
    return [];
  }
  const data = (await res.json()) as {
    result?: Array<{ score?: number; payload?: VectorPayload }>;
  };
  return (data.result ?? [])
    .filter((r) => r.payload?.text && r.payload.userId === userId)
    .map((r) => ({ score: r.score ?? 0, payload: r.payload as VectorPayload }));
}

export async function deleteVectorsForPage(pageId: string): Promise<void> {
  if (!isVectorConfigured()) return;
  // Indexes may be missing on older collections — ensure before filter delete.
  await ensurePayloadIndexes().catch(() => undefined);
  const res = await qdrant(`/collections/${collection()}/points/delete?wait=true`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        must: [{ key: "pageId", match: { value: pageId } }],
      },
    }),
  });
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "");
    logger.error("vector.delete_failed", { status: res.status, body: body.slice(0, 200) });
  }
}
