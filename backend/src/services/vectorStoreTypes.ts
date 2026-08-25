import { createHash } from "crypto";

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

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: VectorPayload;
};

export type VectorProvider = "qdrant" | "pgvector";

export function vectorProvider(): VectorProvider {
  const raw = (process.env.VECTOR_DB_PROVIDER ?? "qdrant").trim().toLowerCase();
  if (raw === "pgvector" || raw === "postgres" || raw === "neon") return "pgvector";
  return "qdrant";
}

export function isVectorConfigured(): boolean {
  if (vectorProvider() === "pgvector") {
    return Boolean(process.env.DATABASE_URL?.trim());
  }
  return Boolean(process.env.VECTOR_DB_URL?.trim());
}

/** Deterministic UUID for a page chunk point id. */
export function chunkPointId(pageId: string, chunkIndex: number): string {
  const hex = createHash("sha1").update(`${pageId}:${chunkIndex}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function vectorConfigSummary(): Record<string, string | boolean> {
  const configured = isVectorConfigured();
  const provider = vectorProvider();
  return {
    configured,
    provider,
    ...(provider === "qdrant"
      ? {
          url: Boolean(process.env.VECTOR_DB_URL?.trim()),
          collection: process.env.VECTOR_DB_COLLECTION ?? "shelf-library",
        }
      : {
          database: Boolean(process.env.DATABASE_URL?.trim()),
        }),
    workerEnabled: process.env.VECTOR_INDEX_WORKER !== "false",
  };
}
