-- Allow pages at library root (no notebook) or notebook root (no topic).
ALTER TABLE "UserTopic" ALTER COLUMN "userSubjectId" DROP NOT NULL;
ALTER TABLE "UserTopic" ALTER COLUMN "userTopicGroupId" DROP NOT NULL;

-- Replace unique(userTopicGroupId, slug) with scope-aware partial uniques
-- (Postgres treats NULLs as distinct in unique constraints).
DROP INDEX IF EXISTS "UserTopic_userTopicGroupId_slug_key";

CREATE UNIQUE INDEX "UserTopic_root_userId_slug_key"
  ON "UserTopic" ("userId", "slug")
  WHERE "userSubjectId" IS NULL AND "userTopicGroupId" IS NULL;

CREATE UNIQUE INDEX "UserTopic_notebook_subjectId_slug_key"
  ON "UserTopic" ("userSubjectId", "slug")
  WHERE "userSubjectId" IS NOT NULL AND "userTopicGroupId" IS NULL;

CREATE UNIQUE INDEX "UserTopic_topic_groupId_slug_key"
  ON "UserTopic" ("userTopicGroupId", "slug")
  WHERE "userTopicGroupId" IS NOT NULL;

CREATE INDEX "UserTopic_userTopicGroupId_idx" ON "UserTopic"("userTopicGroupId");

-- Ownership: root (neither), notebook-level (subject only), or topic (both).
ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_ownership_check" CHECK (
  ("userSubjectId" IS NULL AND "userTopicGroupId" IS NULL)
  OR ("userSubjectId" IS NOT NULL AND "userTopicGroupId" IS NULL)
  OR ("userSubjectId" IS NOT NULL AND "userTopicGroupId" IS NOT NULL)
);
