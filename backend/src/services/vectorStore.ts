import { vectorProvider } from "./vectorStoreTypes.js";
import * as pg from "./vectorStorePg.js";
import * as qdrant from "./vectorStoreQdrant.js";

export {
  chunkPointId,
  isVectorConfigured,
  vectorProvider,
  vectorConfigSummary,
} from "./vectorStoreTypes.js";
export type {
  VectorHit,
  VectorPayload,
  VectorPoint,
  VectorProvider,
} from "./vectorStoreTypes.js";

function store() {
  return vectorProvider() === "pgvector" ? pg : qdrant;
}

export async function upsertVectors(
  points: Parameters<typeof qdrant.upsertVectors>[0]
): Promise<void> {
  return store().upsertVectors(points);
}

export async function searchVectors(
  vector: number[],
  userId: string,
  limit?: number,
  opts?: { pageId?: string; pageIds?: string[] }
): Promise<ReturnType<typeof qdrant.searchVectors>> {
  return store().searchVectors(vector, userId, limit, opts);
}

export async function deleteVectorsForPage(pageId: string): Promise<void> {
  return store().deleteVectorsForPage(pageId);
}
