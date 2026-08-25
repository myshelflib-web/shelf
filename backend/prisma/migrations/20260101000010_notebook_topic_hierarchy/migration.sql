-- Notebook -> Topic -> Page hierarchy, content types, PDF highlights

CREATE TYPE "UserContentType" AS ENUM ('PDF', 'HTML', 'MARKDOWN', 'TEXT', 'DOCX');
CREATE TYPE "HighlightKind" AS ENUM ('TEXT', 'REGION');

CREATE TABLE "UserTopicGroup" (
    "id" TEXT NOT NULL,
    "userSubjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTopicGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserTopicGroup_userSubjectId_slug_key" ON "UserTopicGroup"("userSubjectId", "slug");
CREATE INDEX "UserTopicGroup_userSubjectId_idx" ON "UserTopicGroup"("userSubjectId");

ALTER TABLE "UserTopicGroup" ADD CONSTRAINT "UserTopicGroup_userSubjectId_fkey"
  FOREIGN KEY ("userSubjectId") REFERENCES "UserSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "userTopicGroupId" TEXT;
ALTER TABLE "UserTopic" ADD COLUMN IF NOT EXISTS "contentType" "UserContentType" NOT NULL DEFAULT 'HTML';

ALTER TABLE "UserContentHighlight" ADD COLUMN IF NOT EXISTS "kind" "HighlightKind" NOT NULL DEFAULT 'TEXT';
ALTER TABLE "UserContentHighlight" ADD COLUMN IF NOT EXISTS "pageNumber" INTEGER;
ALTER TABLE "UserContentHighlight" ADD COLUMN IF NOT EXISTS "position" JSONB;
ALTER TABLE "UserContentHighlight" ALTER COLUMN "startOffset" SET DEFAULT 0;
ALTER TABLE "UserContentHighlight" ALTER COLUMN "endOffset" SET DEFAULT 0;

-- Default topic group per notebook for existing pages
INSERT INTO "UserTopicGroup" ("id", "userSubjectId", "title", "slug", "order", "updatedAt")
SELECT
  gen_random_uuid()::text,
  s."id",
  'General',
  'general',
  0,
  CURRENT_TIMESTAMP
FROM "UserSubject" s
WHERE NOT EXISTS (
  SELECT 1 FROM "UserTopicGroup" g WHERE g."userSubjectId" = s."id" AND g."slug" = 'general'
);

UPDATE "UserTopic" t
SET "userTopicGroupId" = g."id"
FROM "UserTopicGroup" g
WHERE g."userSubjectId" = t."userSubjectId"
  AND g."slug" = 'general'
  AND t."userTopicGroupId" IS NULL;

UPDATE "UserTopic"
SET "contentType" = 'PDF', "pdfViewMode" = 'ORIGINAL', "status" = 'PUBLISHED'
WHERE "pdfKey" IS NOT NULL;

ALTER TABLE "UserTopic" ALTER COLUMN "userTopicGroupId" SET NOT NULL;

ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_userTopicGroupId_fkey"
  FOREIGN KEY ("userTopicGroupId") REFERENCES "UserTopicGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "UserTopic_userSubjectId_slug_key";
CREATE UNIQUE INDEX "UserTopic_userTopicGroupId_slug_key" ON "UserTopic"("userTopicGroupId", "slug");
CREATE INDEX IF NOT EXISTS "UserTopic_userSubjectId_idx" ON "UserTopic"("userSubjectId");

ALTER TABLE "UserTopic" ALTER COLUMN "pdfViewMode" SET DEFAULT 'ORIGINAL';
