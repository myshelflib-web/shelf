/*
  Warnings:

  - You are about to alter the column `factualExcerpt` on the `IngestItem` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.
  - You are about to drop the `LibraryVectorChunk` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LibraryVectorChunk" DROP CONSTRAINT "LibraryVectorChunk_pageId_fkey";

-- DropForeignKey
ALTER TABLE "LibraryVectorChunk" DROP CONSTRAINT "LibraryVectorChunk_userId_fkey";

-- AlterTable
ALTER TABLE "IngestItem" ALTER COLUMN "factualExcerpt" SET DATA TYPE VARCHAR(500);

-- DropTable
DROP TABLE "LibraryVectorChunk";
