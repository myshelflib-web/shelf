-- Add per-job toggle for diagram + glance figures on starter-pack pages.
ALTER TABLE "ContentGenJob" ADD COLUMN "withIllustrations" BOOLEAN NOT NULL DEFAULT true;
