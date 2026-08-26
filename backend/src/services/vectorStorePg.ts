import prisma from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import type { VectorHit, VectorPoint } from "./vectorStoreTypes.js";
import { isVectorConfigured } from "./vectorStoreTypes.js";

function toPgVector(values: number[]): string {
  return `[${values.join(",")}]`;
}

let schemaEnsured = false;

async function ensurePgVectorSchema(): Promise<void> {
  if (schemaEnsured || !isVectorConfigured()) return;

  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "LibraryVectorChunk" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "pageId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "notebook" TEXT NOT NULL,
      "topic" TEXT NOT NULL,
      "href" TEXT NOT NULL,
      "text" TEXT NOT NULL,
      "chunkIndex" INTEGER NOT NULL,
      "embedding" vector NOT NULL,
      CONSTRAINT "LibraryVectorChunk_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "LibraryVectorChunk_userId_idx"
    ON "LibraryVectorChunk"("userId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "LibraryVectorChunk_pageId_idx"
    ON "LibraryVectorChunk"("pageId")
  `);

  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "LibraryVectorChunk_embedding_hnsw_idx"
      ON "LibraryVectorChunk" USING hnsw ("embedding" vector_cosine_ops)
    `);
  } catch (err) {
    logger.warn("vector.pg.hnsw_index_skipped", {
      hint: "HNSW index optional; sequential scan still works on small datasets.",
      message: err instanceof Error ? err.message : String(err),
    });
  }

  schemaEnsured = true;
}

export async function upsertVectors(points: VectorPoint[]): Promise<void> {
  if (!isVectorConfigured() || points.length === 0) return;
  await ensurePgVectorSchema();

  const pageIds = [...new Set(points.map((p) => p.payload.pageId))];
  await prisma.$transaction(async (tx) => {
    for (const pageId of pageIds) {
      await tx.$executeRawUnsafe(
        `DELETE FROM "LibraryVectorChunk" WHERE "pageId" = $1`,
        pageId
      );
    }
    for (const point of points) {
      const p = point.payload;
      await tx.$executeRawUnsafe(
        `INSERT INTO "LibraryVectorChunk" (
          "id", "userId", "pageId", "title", "notebook", "topic", "href", "text", "chunkIndex", "embedding"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector)`,
        point.id,
        p.userId,
        p.pageId,
        p.title,
        p.notebook,
        p.topic,
        p.href,
        p.text,
        p.chunkIndex,
        toPgVector(point.vector)
      );
    }
  });
}

type PgVectorRow = {
  score: number;
  userId: string;
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  text: string;
  chunkIndex: number;
};

export async function searchVectors(
  vector: number[],
  userId: string,
  limit = 8,
  opts?: { pageId?: string; pageIds?: string[] }
): Promise<VectorHit[]> {
  if (!isVectorConfigured()) return [];
  if (opts?.pageIds && opts.pageIds.length === 0) return [];

  await ensurePgVectorSchema();
  const queryVector = toPgVector(vector);

  const select = `
    SELECT
      "userId", "pageId", "title", "notebook", "topic", "href", "text", "chunkIndex",
      1 - ("embedding" <=> $1::vector) AS score
    FROM "LibraryVectorChunk"
  `;

  let rows: PgVectorRow[];
  try {
    if (opts?.pageId) {
      rows = await prisma.$queryRawUnsafe<PgVectorRow[]>(
        `${select}
        WHERE "userId" = $2 AND "pageId" = $3
        ORDER BY "embedding" <=> $1::vector
        LIMIT $4`,
        queryVector,
        userId,
        opts.pageId,
        limit
      );
    } else if (opts?.pageIds && opts.pageIds.length > 0) {
      rows = await prisma.$queryRawUnsafe<PgVectorRow[]>(
        `${select}
        WHERE "userId" = $2 AND "pageId" = ANY($3::text[])
        ORDER BY "embedding" <=> $1::vector
        LIMIT $4`,
        queryVector,
        userId,
        opts.pageIds,
        limit
      );
    } else {
      rows = await prisma.$queryRawUnsafe<PgVectorRow[]>(
        `${select}
        WHERE "userId" = $2
        ORDER BY "embedding" <=> $1::vector
        LIMIT $3`,
        queryVector,
        userId,
        limit
      );
    }
  } catch (err) {
    logger.error("vector.search_failed", {
      provider: "pgvector",
      message: err instanceof Error ? err.message : String(err),
    });
    return [];
  }

  return rows
    .filter((row) => row.text && row.userId === userId)
    .map((row) => ({
      score: Number(row.score),
      payload: {
        userId: row.userId,
        pageId: row.pageId,
        title: row.title,
        notebook: row.notebook,
        topic: row.topic,
        href: row.href,
        text: row.text,
        chunkIndex: row.chunkIndex,
      },
    }));
}

export async function listVectorsForPage(
  userId: string,
  pageId: string,
  limit = 48
): Promise<VectorHit[]> {
  if (!isVectorConfigured()) return [];
  await ensurePgVectorSchema();
  try {
    const rows = await prisma.$queryRawUnsafe<PgVectorRow[]>(
      `SELECT
        "userId", "pageId", "title", "notebook", "topic", "href", "text", "chunkIndex",
        1::float AS score
      FROM "LibraryVectorChunk"
      WHERE "userId" = $1 AND "pageId" = $2
      ORDER BY "chunkIndex" ASC
      LIMIT $3`,
      userId,
      pageId,
      limit
    );
    return rows
      .filter((row) => row.text && row.userId === userId)
      .map((row) => ({
        score: 1,
        payload: {
          userId: row.userId,
          pageId: row.pageId,
          title: row.title,
          notebook: row.notebook,
          topic: row.topic,
          href: row.href,
          text: row.text,
          chunkIndex: row.chunkIndex,
        },
      }));
  } catch (err) {
    logger.error("vector.list_failed", {
      provider: "pgvector",
      message: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}

export async function deleteVectorsForPage(pageId: string): Promise<void> {
  if (!isVectorConfigured()) return;
  await ensurePgVectorSchema();
  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "LibraryVectorChunk" WHERE "pageId" = $1`,
      pageId
    );
  } catch (err) {
    logger.error("vector.delete_failed", {
      provider: "pgvector",
      pageId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
