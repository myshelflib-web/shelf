-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "proctored" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Quiz" ADD COLUMN "endedReason" TEXT;
