-- CreateEnum
CREATE TYPE "ContentGenKind" AS ENUM ('STARTER_PACK', 'NEWS_BRIEF');

-- CreateEnum
CREATE TYPE "ContentGenStatus" AS ENUM ('QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "ContentGenJob" (
    "id" TEXT NOT NULL,
    "kind" "ContentGenKind" NOT NULL,
    "status" "ContentGenStatus" NOT NULL DEFAULT 'QUEUED',
    "studyGoal" "StudyGoal" NOT NULL,
    "model" TEXT NOT NULL,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "plannedCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costPaise" INTEGER NOT NULL DEFAULT 0,
    "requestedById" TEXT,
    "error" TEXT,
    "pausedReason" TEXT,
    "pausedAt" TIMESTAMP(3),
    "resumeAttempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGenJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentGenItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subjectSlug" TEXT NOT NULL,
    "topicSlug" TEXT NOT NULL,
    "status" "ContentGenStatus" NOT NULL DEFAULT 'QUEUED',
    "relevanceScore" INTEGER,
    "reviewNotes" TEXT,
    "payload" JSONB,
    "articleId" TEXT,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentGenItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentGenJob_kind_createdAt_idx" ON "ContentGenJob"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "ContentGenJob_status_createdAt_idx" ON "ContentGenJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ContentGenItem_jobId_status_idx" ON "ContentGenItem"("jobId", "status");

-- AddForeignKey
ALTER TABLE "ContentGenItem" ADD CONSTRAINT "ContentGenItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ContentGenJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
