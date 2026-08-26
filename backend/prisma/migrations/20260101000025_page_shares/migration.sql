-- CreateEnum
CREATE TYPE "PageShareRole" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "PageShareStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "UserTopic" ADD COLUMN "linkShareEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "UserTopic" ADD COLUMN "linkShareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserTopic_linkShareToken_key" ON "UserTopic"("linkShareToken");

-- CreateTable
CREATE TABLE "PageShare" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "granteeId" TEXT,
    "granteeEmail" TEXT NOT NULL,
    "role" "PageShareRole" NOT NULL DEFAULT 'VIEWER',
    "status" "PageShareStatus" NOT NULL DEFAULT 'PENDING',
    "hiddenAt" TIMESTAMP(3),
    "seenAt" TIMESTAMP(3),
    "copiedPageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageShare_pageId_granteeEmail_key" ON "PageShare"("pageId", "granteeEmail");

-- CreateIndex
CREATE INDEX "PageShare_granteeId_status_idx" ON "PageShare"("granteeId", "status");

-- CreateIndex
CREATE INDEX "PageShare_granteeEmail_status_idx" ON "PageShare"("granteeEmail", "status");

-- CreateIndex
CREATE INDEX "PageShare_pageId_status_idx" ON "PageShare"("pageId", "status");

-- CreateIndex
CREATE INDEX "PageShare_ownerId_idx" ON "PageShare"("ownerId");

-- AddForeignKey
ALTER TABLE "PageShare" ADD CONSTRAINT "PageShare_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageShare" ADD CONSTRAINT "PageShare_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageShare" ADD CONSTRAINT "PageShare_granteeId_fkey" FOREIGN KEY ("granteeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
