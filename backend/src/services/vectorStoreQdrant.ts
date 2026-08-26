import { logger } from "../utils/logger.js";
import { fetchWithTimeout } from "../utils/timeout.js";
import type { VectorHit, VectorPayload, VectorPoint } from "./vectorStoreTypes.js";
import { isVectorConfigured } from "./vectorStoreTypes.js";

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

export async function upsertVectors(points: VectorPoint[]): Promise<void> {
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

/** All chunks for one page (no embedding). Used to cover a whole PDF. */
export async function listVectorsForPage(
  userId: string,
  pageId: string,
  limit = 48
): Promise<VectorHit[]> {
  if (!isVectorConfigured()) return [];
  await ensurePayloadIndexes().catch(() => undefined);
  const res = await qdrant(`/collections/${collection()}/points/scroll`, {
    method: "POST",
    body: JSON.stringify({
      limit,
      with_payload: true,
      with_vector: false,
      filter: {
        must: [
          { key: "userId", match: { value: userId } },
          { key: "pageId", match: { value: pageId } },
        ],
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error("vector.scroll_failed", { status: res.status, body: body.slice(0, 300) });
    return [];
  }
  const data = (await res.json()) as {
    result?: { points?: Array<{ payload?: VectorPayload }> };
  };
  return (data.result?.points ?? [])
    .filter((p) => p.payload?.text && p.payload.userId === userId)
    .sort(
      (a, b) => (a.payload?.chunkIndex ?? 0) - (b.payload?.chunkIndex ?? 0)
    )
    .map((p) => ({ score: 1, payload: p.payload as VectorPayload }));
}

export async function deleteVectorsForPage(pageId: string): Promise<void> {
  if (!isVectorConfigured()) return;
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
