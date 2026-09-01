-- Unified library: folders (nested) + files. Migrates UserSubject/UserTopicGroup → UserFolder,
-- adds folderId on UserTopic (files). Legacy tables kept for rollback; app uses UserFolder + folderId.

CREATE TABLE "UserFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '📁',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFolder_pkey" PRIMARY KEY ("id")
);

-- Top-level folders (former collections)
INSERT INTO "UserFolder" ("id", "userId", "parentId", "name", "slug", "description", "icon", "order", "createdAt", "updatedAt")
SELECT "id", "userId", NULL, "name", "slug", "description", "icon", "order", "createdAt", "updatedAt"
FROM "UserSubject";

-- Nested folders (former topics)
INSERT INTO "UserFolder" ("id", "userId", "parentId", "name", "slug", "description", "icon", "order", "createdAt", "updatedAt")
SELECT tg."id", s."userId", tg."userSubjectId", tg."title", tg."slug", NULL, '📁', tg."order", tg."createdAt", tg."updatedAt"
FROM "UserTopicGroup" tg
JOIN "UserSubject" s ON s."id" = tg."userSubjectId";

ALTER TABLE "UserFolder" ADD CONSTRAINT "UserFolder_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserFolder" ADD CONSTRAINT "UserFolder_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "UserFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "UserFolder_userId_idx" ON "UserFolder"("userId");
CREATE INDEX "UserFolder_parentId_idx" ON "UserFolder"("parentId");

CREATE UNIQUE INDEX "UserFolder_root_userId_slug_key"
    ON "UserFolder" ("userId", "slug")
    WHERE "parentId" IS NULL;

CREATE UNIQUE INDEX "UserFolder_parent_slug_key"
    ON "UserFolder" ("parentId", "slug")
    WHERE "parentId" IS NOT NULL;

-- Link files to their folder (nested topic folder, collection folder, or null = library root)
ALTER TABLE "UserTopic" ADD COLUMN "folderId" TEXT;

UPDATE "UserTopic" SET "folderId" = "userTopicGroupId" WHERE "userTopicGroupId" IS NOT NULL;
UPDATE "UserTopic" SET "folderId" = "userSubjectId"
    WHERE "userSubjectId" IS NOT NULL AND "userTopicGroupId" IS NULL;

ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "UserFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "UserTopic_folderId_idx" ON "UserTopic"("folderId");

-- File slug uniqueness within a folder (replaces dual-FK partial indexes for new writes)
CREATE UNIQUE INDEX "UserTopic_root_userId_slug_folder_key"
    ON "UserTopic" ("userId", "slug")
    WHERE "folderId" IS NULL;

CREATE UNIQUE INDEX "UserTopic_folder_slug_key"
    ON "UserTopic" ("folderId", "slug")
    WHERE "folderId" IS NOT NULL;

-- Study AI / quiz: single folder scope (replaces notebook + topic ids; same UUIDs after migration)
ALTER TABLE "ChatThread" ADD COLUMN "contextFolderId" TEXT;
UPDATE "ChatThread" SET "contextFolderId" = COALESCE("contextTopicId", "contextNotebookId")
    WHERE "contextNotebookId" IS NOT NULL;

ALTER TABLE "Quiz" ADD COLUMN "contextFolderId" TEXT;
UPDATE "Quiz" SET "contextFolderId" = COALESCE("contextTopicId", "contextNotebookId")
    WHERE "contextNotebookId" IS NOT NULL;
