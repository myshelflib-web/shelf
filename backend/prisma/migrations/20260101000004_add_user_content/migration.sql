-- CreateTable UserSubject
CREATE TABLE "UserSubject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT '📁',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserTopic
CREATE TABLE "UserTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userSubjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contentUrl" TEXT,
    "pdfKey" TEXT,
    "status" "TopicStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable UserContentHighlight
CREATE TABLE "UserContentHighlight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userTopicId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserContentHighlight_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserSubject_userId_slug_key" ON "UserSubject"("userId", "slug");
CREATE INDEX "UserSubject_userId_idx" ON "UserSubject"("userId");
CREATE UNIQUE INDEX "UserTopic_userSubjectId_slug_key" ON "UserTopic"("userSubjectId", "slug");
CREATE INDEX "UserTopic_userId_idx" ON "UserTopic"("userId");
CREATE INDEX "UserContentHighlight_userId_userTopicId_idx" ON "UserContentHighlight"("userId", "userTopicId");

ALTER TABLE "UserSubject" ADD CONSTRAINT "UserSubject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserTopic" ADD CONSTRAINT "UserTopic_userSubjectId_fkey" FOREIGN KEY ("userSubjectId") REFERENCES "UserSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserContentHighlight" ADD CONSTRAINT "UserContentHighlight_userTopicId_fkey" FOREIGN KEY ("userTopicId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
