-- CreateEnum
CREATE TYPE "IngestSourceKind" AS ENUM ('RSS', 'OFFICIAL_PDF_WATCH', 'OFFICIAL_PAGE_WATCH');

-- CreateEnum
CREATE TYPE "IngestLicense" AS ENUM ('GOVERNMENT_PRESS', 'LINK_ONLY', 'OFFICIAL_DOCUMENT');

-- CreateEnum
CREATE TYPE "IngestRefreshCadence" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "IngestItemStatus" AS ENUM ('FETCHED', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "IngestJobPhase" AS ENUM ('POLL', 'FETCH', 'PROCESS', 'PROMOTE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "IngestJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "edition" TEXT,
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "supersededById" TEXT;

-- CreateTable
CREATE TABLE "IngestSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "IngestSourceKind" NOT NULL,
    "feedUrl" TEXT NOT NULL,
    "studyGoals" "StudyGoal"[],
    "license" "IngestLicense" NOT NULL,
    "cadence" "IngestRefreshCadence" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "maxItemsPerRun" INTEGER NOT NULL DEFAULT 20,
    "promoteToSubjectSlug" TEXT,
    "promoteToTopicSlug" TEXT,
    "lastPolledAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestItem" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "canonicalUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "status" "IngestItemStatus" NOT NULL DEFAULT 'FETCHED',
    "license" "IngestLicense" NOT NULL,
    "shelfSummary" TEXT,
    "factualExcerpt" TEXT,
    "fullDocumentStored" BOOLEAN NOT NULL DEFAULT false,
    "studyGoals" "StudyGoal"[],
    "tags" TEXT[],
    "edition" TEXT,
    "sourcePdfUrl" TEXT,
    "pdfKey" TEXT,
    "articleId" TEXT,
    "supersededById" TEXT,
    "validUntil" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAtShelf" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "itemId" TEXT,
    "phase" "IngestJobPhase" NOT NULL,
    "status" "IngestJobStatus" NOT NULL DEFAULT 'QUEUED',
    "sqsMessageId" TEXT,
    "payload" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestSource_slug_key" ON "IngestSource"("slug");

-- CreateIndex
CREATE INDEX "IngestSource_enabled_cadence_idx" ON "IngestSource"("enabled", "cadence");

-- CreateIndex
CREATE UNIQUE INDEX "IngestItem_articleId_key" ON "IngestItem"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "IngestItem_supersededById_key" ON "IngestItem"("supersededById");

-- CreateIndex
CREATE INDEX "IngestItem_status_publishedAt_idx" ON "IngestItem"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "IngestItem_publishedAtShelf_idx" ON "IngestItem"("publishedAtShelf");

-- CreateIndex
CREATE UNIQUE INDEX "IngestItem_sourceId_contentHash_key" ON "IngestItem"("sourceId", "contentHash");

-- CreateIndex
CREATE INDEX "IngestJob_phase_status_createdAt_idx" ON "IngestJob"("phase", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Article_status_edition_idx" ON "Article"("status", "edition");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestItem" ADD CONSTRAINT "IngestItem_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IngestSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestItem" ADD CONSTRAINT "IngestItem_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestItem" ADD CONSTRAINT "IngestItem_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "IngestItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IngestSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestJob" ADD CONSTRAINT "IngestJob_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "IngestItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
