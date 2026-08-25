-- Study AI vector chunks stored in Postgres (Neon pgvector).
CREATE EXTENSION IF NOT EXISTS vector;

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
);

CREATE INDEX IF NOT EXISTS "LibraryVectorChunk_userId_idx" ON "LibraryVectorChunk"("userId");
CREATE INDEX IF NOT EXISTS "LibraryVectorChunk_pageId_idx" ON "LibraryVectorChunk"("pageId");

ALTER TABLE "LibraryVectorChunk"
  ADD CONSTRAINT "LibraryVectorChunk_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LibraryVectorChunk"
  ADD CONSTRAINT "LibraryVectorChunk_pageId_fkey"
  FOREIGN KEY ("pageId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
