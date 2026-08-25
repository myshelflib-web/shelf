-- Per-user vector chunk quota tracking and LRU eviction metadata.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vectorChunksUsed" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PageVectorIndex" (
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageVectorIndex_pkey" PRIMARY KEY ("pageId")
);

CREATE INDEX IF NOT EXISTS "PageVectorIndex_userId_indexedAt_idx" ON "PageVectorIndex"("userId", "indexedAt");

ALTER TABLE "PageVectorIndex" ADD CONSTRAINT "PageVectorIndex_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageVectorIndex" ADD CONSTRAINT "PageVectorIndex_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
