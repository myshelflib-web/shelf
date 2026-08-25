ALTER TYPE "UserContentType" ADD VALUE 'LINK';

ALTER TABLE "UserTopic" ADD COLUMN "sourceUrl" TEXT;
