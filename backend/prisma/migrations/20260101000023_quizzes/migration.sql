-- CreateEnum
CREATE TYPE "QuizSourceKind" AS ENUM ('LIBRARY', 'UPLOAD', 'EXAM_BANK');

-- CreateEnum
CREATE TYPE "QuizDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXAM');

-- CreateEnum
CREATE TYPE "QuizQuestionType" AS ENUM ('MCQ', 'WRITTEN', 'IMAGE');

-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('GENERATING', 'READY', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'FAILED');

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Quiz',
    "sourceKind" "QuizSourceKind" NOT NULL,
    "contextKind" TEXT NOT NULL DEFAULT 'LIBRARY',
    "contextNotebookId" TEXT,
    "contextTopicId" TEXT,
    "contextPageId" TEXT,
    "relevancyDocId" TEXT,
    "sourceLabel" TEXT,
    "focusTopic" TEXT,
    "sourceExcerpt" TEXT,
    "difficulty" "QuizDifficulty" NOT NULL DEFAULT 'EXAM',
    "timeLimitSec" INTEGER,
    "mcqCount" INTEGER NOT NULL DEFAULT 5,
    "writtenCount" INTEGER NOT NULL DEFAULT 2,
    "status" "QuizStatus" NOT NULL DEFAULT 'GENERATING',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "QuizQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" JSONB,
    "correctOptionId" TEXT,
    "modelAnswer" TEXT,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "syllabusHeading" TEXT,
    "sourceTag" TEXT,
    "userAnswerText" TEXT,
    "userAnswerOption" TEXT,
    "userImageKey" TEXT,
    "userImageMime" TEXT,
    "gradedScore" DOUBLE PRECISION,
    "gradedFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quiz_userId_updatedAt_idx" ON "Quiz"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Quiz_relevancyDocId_idx" ON "Quiz"("relevancyDocId");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizId_order_idx" ON "QuizQuestion"("quizId", "order");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_relevancyDocId_fkey" FOREIGN KEY ("relevancyDocId") REFERENCES "StudyRelevancyDoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
