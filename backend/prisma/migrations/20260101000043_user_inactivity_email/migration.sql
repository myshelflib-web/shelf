-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastActiveAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastInactivityEmailAt" TIMESTAMP(3);

-- Backfill so existing accounts are not all emailed on first worker tick.
UPDATE "User" SET "lastActiveAt" = "updatedAt" WHERE "lastActiveAt" IS NULL;

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
