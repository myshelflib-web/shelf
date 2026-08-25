-- Create Article table and migrate content from Topic into Article rows

CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "TopicStatus" NOT NULL DEFAULT 'DRAFT',
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "previewPercent" INTEGER NOT NULL DEFAULT 30,
    "pdfKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- Each existing topic becomes a topic with one article (same title/slug/content)
INSERT INTO "Article" ("id", "topicId", "title", "slug", "contentUrl", "order", "status", "isPremium", "previewPercent", "pdfKey", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "title",
    "slug",
    "contentUrl",
    "order",
    "status",
    "isPremium",
    "previewPercent",
    "pdfKey",
    "createdAt",
    "updatedAt"
FROM "Topic";

-- Highlight: topicId -> articleId
ALTER TABLE "Highlight" ADD COLUMN "articleId" TEXT;

UPDATE "Highlight" h
SET "articleId" = a."id"
FROM "Article" a
WHERE a."topicId" = h."topicId";

ALTER TABLE "Highlight" DROP CONSTRAINT "Highlight_topicId_fkey";
ALTER TABLE "Highlight" DROP COLUMN "topicId";
ALTER TABLE "Highlight" ALTER COLUMN "articleId" SET NOT NULL;

-- UserProgress: topicId -> articleId
ALTER TABLE "UserProgress" ADD COLUMN "articleId" TEXT;

UPDATE "UserProgress" p
SET "articleId" = a."id"
FROM "Article" a
WHERE a."topicId" = p."topicId";

ALTER TABLE "UserProgress" DROP CONSTRAINT "UserProgress_topicId_fkey";
DROP INDEX IF EXISTS "UserProgress_userId_topicId_key";
ALTER TABLE "UserProgress" DROP COLUMN "topicId";
ALTER TABLE "UserProgress" ALTER COLUMN "articleId" SET NOT NULL;

-- StarredTopic -> StarredArticle
CREATE TABLE "StarredArticle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StarredArticle_pkey" PRIMARY KEY ("id")
);

INSERT INTO "StarredArticle" ("id", "userId", "articleId", "createdAt")
SELECT gen_random_uuid()::text, s."userId", a."id", s."createdAt"
FROM "StarredTopic" s
JOIN "Article" a ON a."topicId" = s."topicId";

DROP TABLE "StarredTopic";

-- Strip content fields from Topic (now a grouping container)
ALTER TABLE "Topic" DROP COLUMN "contentUrl";
ALTER TABLE "Topic" DROP COLUMN "status";
ALTER TABLE "Topic" DROP COLUMN "isPremium";
ALTER TABLE "Topic" DROP COLUMN "previewPercent";
ALTER TABLE "Topic" DROP COLUMN "pdfKey";
ALTER TABLE "Topic" ADD COLUMN "description" TEXT;

-- Article indexes and FKs
CREATE UNIQUE INDEX "Article_topicId_slug_key" ON "Article"("topicId", "slug");
ALTER TABLE "Article" ADD CONSTRAINT "Article_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Index on topicId was already dropped with the column; recreate for articleId
DROP INDEX IF EXISTS "Highlight_userId_topicId_idx";
CREATE INDEX "Highlight_userId_articleId_idx" ON "Highlight"("userId", "articleId");

ALTER TABLE "UserProgress" ADD CONSTRAINT "UserProgress_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "UserProgress_userId_articleId_key" ON "UserProgress"("userId", "articleId");

ALTER TABLE "StarredArticle" ADD CONSTRAINT "StarredArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StarredArticle" ADD CONSTRAINT "StarredArticle_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "StarredArticle_userId_articleId_key" ON "StarredArticle"("userId", "articleId");

-- Rename TopicStatus enum to ContentStatus (used by Article and UserTopic)
ALTER TYPE "TopicStatus" RENAME TO "ContentStatus";
