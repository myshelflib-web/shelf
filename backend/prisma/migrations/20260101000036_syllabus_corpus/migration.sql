-- AlterEnum
ALTER TYPE "ContentGenKind" ADD VALUE 'TOPIC_EXPANSION';
ALTER TYPE "ContentGenKind" ADD VALUE 'SPEC_SYNTHESIS';
ALTER TYPE "ContentGenKind" ADD VALUE 'CORPUS_PAGE';

-- CreateEnum
CREATE TYPE "TopicCurationStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'GENERATED');

-- CreateTable
CREATE TABLE "SyllabusTopic" (
    "id" TEXT NOT NULL,
    "studyGoal" "StudyGoal" NOT NULL,
    "subjectSlug" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "paper" TEXT,
    "topicSlug" TEXT NOT NULL,
    "topicTitle" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "syllabusAnchor" TEXT NOT NULL,
    "unitKey" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "TopicCurationStatus" NOT NULL DEFAULT 'PROPOSED',
    "spec" JSONB,
    "specModel" TEXT,
    "canonicalKey" TEXT,
    "articleId" TEXT,
    "generatedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyllabusTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorpusDocument" (
    "id" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "studyGoals" "StudyGoal"[],
    "subjectSlug" TEXT,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "indexedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorpusDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyllabusTopic_studyGoal_slug_key" ON "SyllabusTopic"("studyGoal", "slug");

-- CreateIndex
CREATE INDEX "SyllabusTopic_studyGoal_status_priority_idx" ON "SyllabusTopic"("studyGoal", "status", "priority");

-- CreateIndex
CREATE INDEX "SyllabusTopic_subjectSlug_topicSlug_idx" ON "SyllabusTopic"("subjectSlug", "topicSlug");

-- CreateIndex
CREATE INDEX "SyllabusTopic_canonicalKey_idx" ON "SyllabusTopic"("canonicalKey");

-- CreateIndex
CREATE INDEX "SyllabusTopic_unitKey_idx" ON "SyllabusTopic"("unitKey");

-- CreateIndex
CREATE UNIQUE INDEX "CorpusDocument_sourceKey_key" ON "CorpusDocument"("sourceKey");

-- CreateIndex
CREATE INDEX "CorpusDocument_sourceName_idx" ON "CorpusDocument"("sourceName");

-- CreateIndex
CREATE INDEX "CorpusDocument_subjectSlug_idx" ON "CorpusDocument"("subjectSlug");
