-- CreateTable
CREATE TABLE "StudyRelevancyDoc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "originalFilename" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyRelevancyDoc_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN     "contextKind" TEXT NOT NULL DEFAULT 'LIBRARY';
ALTER TABLE "ChatThread" ADD COLUMN     "contextNotebookId" TEXT;
ALTER TABLE "ChatThread" ADD COLUMN     "contextTopicId" TEXT;
ALTER TABLE "ChatThread" ADD COLUMN     "contextPageId" TEXT;
ALTER TABLE "ChatThread" ADD COLUMN     "relevancyDocId" TEXT;

-- CreateIndex
CREATE INDEX "StudyRelevancyDoc_userId_updatedAt_idx" ON "StudyRelevancyDoc"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatThread_relevancyDocId_idx" ON "ChatThread"("relevancyDocId");

-- AddForeignKey
ALTER TABLE "StudyRelevancyDoc" ADD CONSTRAINT "StudyRelevancyDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatThread" ADD CONSTRAINT "ChatThread_relevancyDocId_fkey" FOREIGN KEY ("relevancyDocId") REFERENCES "StudyRelevancyDoc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
