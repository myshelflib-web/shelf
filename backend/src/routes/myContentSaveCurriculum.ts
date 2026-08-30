import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { finishCurriculumLibraryCopy } from "../services/curriculumLibraryCopy.js";
import { pageHref, userDocPrefix } from "../utils/docPaths.js";
import { errorFields } from "../utils/logger.js";
import { isPremiumUser } from "../utils/paywall.js";
import {
  isReservedSlug,
  nextPageOrder,
  uniquePageSlug,
  type PageSlugScope,
} from "../utils/pageScope.js";
import prisma from "../utils/prisma.js";
import { userSelect } from "../utils/publicUser.js";
import { slugify } from "../utils/slugify.js";
import { curriculumSourceUrl } from "../utils/curriculumCopy.js";

const router = Router();
router.use(authMiddleware);

async function findOrCreateCollection(
  userId: string,
  name: string,
  description?: string | null
) {
  const slug = slugify(name) || "collection";
  if (isReservedSlug(slug)) {
    const fallback = `${slug}-library`;
    const existing = await prisma.userSubject.findUnique({
      where: { userId_slug: { userId, slug: fallback } },
    });
    if (existing) return existing;
    const count = await prisma.userSubject.count({ where: { userId } });
    return prisma.userSubject.create({
      data: {
        userId,
        name: name.trim(),
        slug: fallback,
        description: description ?? undefined,
        order: count + 1,
      },
    });
  }
  const existing = await prisma.userSubject.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (existing) return existing;
  const count = await prisma.userSubject.count({ where: { userId } });
  return prisma.userSubject.create({
    data: {
      userId,
      name: name.trim(),
      slug,
      description: description ?? undefined,
      order: count + 1,
    },
  });
}

/** Copy a published curriculum article into the user's personal library. */
router.post("/from-curriculum", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const subjectSlug =
    typeof req.body?.subjectSlug === "string" ? req.body.subjectSlug : "";
  const topicSlug =
    typeof req.body?.topicSlug === "string" ? req.body.topicSlug : "";
  const articleSlug =
    typeof req.body?.articleSlug === "string" ? req.body.articleSlug : "";
  if (!subjectSlug || !topicSlug || !articleSlug) {
    res.status(400).json({ error: "subjectSlug, topicSlug, and articleSlug are required" });
    return;
  }

  const article = await prisma.article.findFirst({
    where: {
      slug: articleSlug,
      status: "PUBLISHED",
      topic: { slug: topicSlug, subject: { slug: subjectSlug } },
    },
    include: { topic: { include: { subject: true } } },
  });
  if (!article) {
    res.status(404).json({ error: "Article not found" });
    return;
  }

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!me) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (article.isPremium && !isPremiumUser(me)) {
    res.status(403).json({ error: "This article is on Premium" });
    return;
  }

  const marker = curriculumSourceUrl(article.id);
  const already = await prisma.userTopic.findFirst({
    where: { userId, sourceUrl: marker },
  });
  if (already) {
    const notebook = already.userSubjectId
      ? await prisma.userSubject.findFirst({
          where: { id: already.userSubjectId, userId },
          select: { slug: true },
        })
      : null;
    const topic = already.userTopicGroupId
      ? await prisma.userTopicGroup.findFirst({
          where: { id: already.userTopicGroupId },
          select: { slug: true },
        })
      : null;
    res.json({
      page: {
        id: already.id,
        title: already.title,
        slug: already.slug,
        contentType: already.contentType,
      },
      href: pageHref(notebook?.slug, topic?.slug, already.slug),
      alreadySaved: true,
      status: already.status,
    });
    return;
  }

  if (!article.pdfKey && !article.contentUrl) {
    res.status(400).json({ error: "This article has no file to copy" });
    return;
  }

  const collection = await findOrCreateCollection(
    userId,
    article.topic.subject.name,
    article.topic.subject.description
  );
  const scope: PageSlugScope = {
    kind: "notebook",
    userSubjectId: collection.id,
  };

  const slug = await uniquePageSlug(scope, article.title);
  const docPrefix = userDocPrefix(userId, collection.slug, null, slug);
  const order = await nextPageOrder(scope);

  const created = await prisma.userTopic.create({
    data: {
      userId,
      userSubjectId: collection.id,
      userTopicGroupId: null,
      title: article.title,
      slug,
      contentType: article.pdfKey ? "PDF" : "HTML",
      pdfKey: article.pdfKey ? `${docPrefix}/source.pdf` : null,
      contentUrl: article.contentUrl ? `${docPrefix}/content.html` : null,
      sourceUrl: marker,
      fileSizeBytes: 0,
      status: "PROCESSING",
      order,
    },
  });

  res.status(202).json({
    page: {
      id: created.id,
      title: created.title,
      slug: created.slug,
      contentType: created.contentType,
    },
    href: pageHref(collection.slug, null, created.slug),
    alreadySaved: false,
    status: "PROCESSING",
  });

  void finishCurriculumLibraryCopy({
    userId,
    pageId: created.id,
    article: {
      id: article.id,
      pdfKey: article.pdfKey,
      contentUrl: article.contentUrl,
    },
    docPrefix,
    me,
    log: req.log,
  }).catch((err) => {
    req.log?.error("curriculum.save_async_unhandled", errorFields(err));
  });
});

export default router;
