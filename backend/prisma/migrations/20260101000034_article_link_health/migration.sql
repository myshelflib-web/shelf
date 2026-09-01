-- Link health + optional URL repair tracking for preloaded Learn articles.
ALTER TABLE "Article" ADD COLUMN "linkStatus" "IngestLinkStatus" NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "Article" ADD COLUMN "embeddable" BOOLEAN;
ALTER TABLE "Article" ADD COLUMN "lastHttpStatus" INTEGER;
ALTER TABLE "Article" ADD COLUMN "lastLinkCheckAt" TIMESTAMP(3);
ALTER TABLE "Article" ADD COLUMN "sourceUrlChecked" TEXT;
ALTER TABLE "Article" ADD COLUMN "lastUrlRepairAt" TIMESTAMP(3);

CREATE INDEX "Article_linkStatus_lastLinkCheckAt_idx" ON "Article"("linkStatus", "lastLinkCheckAt");
