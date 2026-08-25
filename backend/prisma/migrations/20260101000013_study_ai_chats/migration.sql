CREATE TABLE IF NOT EXISTS "ChatThread" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT 'New chat',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatThread_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "threadId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "citations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatThread_userId_updatedAt_idx" ON "ChatThread"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_createdAt_idx" ON "ChatMessage"("threadId", "createdAt");

ALTER TABLE "ChatThread" DROP CONSTRAINT IF EXISTS "ChatThread_userId_fkey";
ALTER TABLE "ChatThread"
  ADD CONSTRAINT "ChatThread_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_threadId_fkey";
ALTER TABLE "ChatMessage"
  ADD CONSTRAINT "ChatMessage_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
