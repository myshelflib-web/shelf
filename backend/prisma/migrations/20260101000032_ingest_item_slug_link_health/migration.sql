-- CreateEnum
CREATE TYPE "IngestLinkStatus" AS ENUM ('OK', 'BROKEN', 'BLOCKED_EMBED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "IngestItem" ADD COLUMN "slug" TEXT;
ALTER TABLE "IngestItem" ADD COLUMN "linkStatus" "IngestLinkStatus" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "IngestItem" ADD COLUMN "embeddable" BOOLEAN;
ALTER TABLE "IngestItem" ADD COLUMN "lastHttpStatus" INTEGER;
ALTER TABLE "IngestItem" ADD COLUMN "lastLinkCheckAt" TIMESTAMP(3);

-- Backfill slugs from title + id suffix (unique)
UPDATE "IngestItem"
SET "slug" = trim(both '-' from lower(regexp_replace(left("title", 80), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || left("id", 8)
WHERE "slug" IS NULL;

UPDATE "IngestItem"
SET "slug" = left("id", 8)
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "IngestItem" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "IngestItem_slug_key" ON "IngestItem"("slug");
