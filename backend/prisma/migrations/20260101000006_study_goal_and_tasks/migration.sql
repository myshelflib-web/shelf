-- Study goal on users + calendar tasks

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studyGoal" TEXT;

CREATE TABLE IF NOT EXISTS "StudyTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "articleId" TEXT,
    "href" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StudyTask_userId_dueAt_idx" ON "StudyTask"("userId", "dueAt");

ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudyTask" ADD CONSTRAINT "StudyTask_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
