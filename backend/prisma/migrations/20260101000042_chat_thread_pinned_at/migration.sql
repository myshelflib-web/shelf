-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ChatThread_userId_pinnedAt_idx" ON "ChatThread"("userId", "pinnedAt");
