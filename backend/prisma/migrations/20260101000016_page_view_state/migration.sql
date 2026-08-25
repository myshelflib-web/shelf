-- Per-page reading position so scroll/PDF page syncs across devices.
ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "viewPdfPage" INTEGER;
ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "viewPageOffset" DOUBLE PRECISION;
ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "viewScrollTop" INTEGER;
ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "viewScale" DOUBLE PRECISION;
ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "viewedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "UserTopic_userId_viewedAt_idx"
  ON "UserTopic"("userId", "viewedAt");
