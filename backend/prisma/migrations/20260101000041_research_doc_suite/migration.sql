-- Research Doc suite: citations, revisions, comments
CREATE TABLE "CitationSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" JSONB NOT NULL DEFAULT '[]',
    "year" TEXT,
    "doi" TEXT,
    "url" TEXT,
    "container" TEXT,
    "pages" TEXT,
    "type" TEXT NOT NULL DEFAULT 'article',
    "bibtexKey" TEXT,
    "rawCsl" JSONB,
    "pageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitationSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocSourceLink" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "DocSourceLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageRevision" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PageComment" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "anchorQuote" TEXT,
    "anchorJson" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CitationSource_userId_idx" ON "CitationSource"("userId");
CREATE INDEX "CitationSource_userId_bibtexKey_idx" ON "CitationSource"("userId", "bibtexKey");
CREATE INDEX "CitationSource_userId_title_idx" ON "CitationSource"("userId", "title");

CREATE UNIQUE INDEX "DocSourceLink_pageId_sourceId_key" ON "DocSourceLink"("pageId", "sourceId");
CREATE INDEX "DocSourceLink_pageId_idx" ON "DocSourceLink"("pageId");
CREATE INDEX "DocSourceLink_sourceId_idx" ON "DocSourceLink"("sourceId");

CREATE INDEX "PageRevision_pageId_createdAt_idx" ON "PageRevision"("pageId", "createdAt");
CREATE INDEX "PageRevision_userId_idx" ON "PageRevision"("userId");

CREATE INDEX "PageComment_pageId_createdAt_idx" ON "PageComment"("pageId", "createdAt");
CREATE INDEX "PageComment_userId_idx" ON "PageComment"("userId");
CREATE INDEX "PageComment_parentId_idx" ON "PageComment"("parentId");

ALTER TABLE "CitationSource" ADD CONSTRAINT "CitationSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocSourceLink" ADD CONSTRAINT "DocSourceLink_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocSourceLink" ADD CONSTRAINT "DocSourceLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CitationSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageRevision" ADD CONSTRAINT "PageRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageRevision" ADD CONSTRAINT "PageRevision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "UserTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PageComment" ADD CONSTRAINT "PageComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PageComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
