-- Replace StudyGoal enum with exam tracks; map non-UPSC users to GENERAL.
-- Tag curriculum subjects with studyGoal (default UPSC).

ALTER TABLE "User" ALTER COLUMN "studyGoal" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "studyGoal" TYPE TEXT USING ("studyGoal"::text);

UPDATE "User"
SET "studyGoal" = CASE
  WHEN "studyGoal" = 'UPSC' THEN 'UPSC'
  ELSE 'GENERAL'
END;

DROP TYPE "StudyGoal";

CREATE TYPE "StudyGoal" AS ENUM (
  'GENERAL',
  'UPSC',
  'STATE_PCS',
  'JUDICIARY',
  'CA',
  'NEET_PG',
  'GATE'
);

ALTER TABLE "User"
  ALTER COLUMN "studyGoal" TYPE "StudyGoal" USING ("studyGoal"::"StudyGoal");

ALTER TABLE "User"
  ALTER COLUMN "studyGoal" SET DEFAULT 'GENERAL'::"StudyGoal";

ALTER TABLE "Subject"
  ADD COLUMN IF NOT EXISTS "studyGoal" "StudyGoal" NOT NULL DEFAULT 'UPSC'::"StudyGoal";

CREATE INDEX IF NOT EXISTS "Subject_studyGoal_idx" ON "Subject"("studyGoal");
