import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { finishCurriculumLibraryCopy } from "../services/curriculumLibraryCopy.js";
import { resolveCurriculumSavePolicy } from "../services/curriculumSavePolicy.js";
import { scheduleIndexPage } from "../services/libraryIndex.js";
import {
  createRootFolder,
  findFolderBySlug,
} from "../services/libraryStore.js";
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
  const safeName = isReservedSlug(slug) ? `${name.trim()} library` : name.trim();
  const resolvedSlug = isReservedSlug(slug) ? `${slug}-library` : slug;
  const existing = await findFolderBySlug(userId, null, resolvedSlug);
  if (existing) return existing;
  return createRootFolder(userId, {
    name: safeName,
    description: description ?? null,
  });
}

async function findExistingCurriculumSave(userId: string, marker: string) {
  return prisma.userTopic.findFirst({
    where: {
      userId,
      OR: [{ sourceUrl: marker }, { contentUrl: marker }],
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
    include: {
      topic: { include: { subject: true } },
      ingestItem: { select: { license: true } },
    },
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

  const savePolicy = resolveCurriculumSavePolicy(article);
  if (!savePolicy.allowed) {
    res.status(400).json({ error: "This article cannot be saved to your library" });
    return;
  }

  const marker = curriculumSourceUrl(article.id);
  const already = await findExistingCurriculumSave(userId, marker);
  if (already) {
    const folder = already.folderId
      ? await prisma.userFolder.findFirst({
          where: { id: already.folderId, userId },
          select: { slug: true, parentId: true },
        })
      : null;
    let notebookSlug: string | null = folder?.slug ?? null;
    let topicSlug: string | null = null;
    if (folder?.parentId) {
      topicSlug = folder.slug;
      const root = await prisma.userFolder.findFirst({
        where: { id: folder.parentId, userId },
        select: { slug: true },
      });
      notebookSlug = root?.slug ?? null;
    } else if (!folder && already.userSubjectId) {
      const notebook = await prisma.userSubject.findFirst({
        where: { id: already.userSubjectId, userId },
        select: { slug: true },
      });
      notebookSlug = notebook?.slug ?? null;
      if (already.userTopicGroupId) {
        const topic = await prisma.userTopicGroup.findFirst({
          where: { id: already.userTopicGroupId },
          select: { slug: true },
        });
        topicSlug = topic?.slug ?? null;
      }
    }
    res.json({
      page: {
        id: already.id,
        title: already.title,
        slug: already.slug,
        contentType: already.contentType,
      },
      href: pageHref(notebookSlug, topicSlug, already.slug),
      alreadySaved: true,
      status: already.status,
    });
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

  if (savePolicy.mode === "link") {
    const embedUrl = savePolicy.embedUrl ?? article.sourceUrl;
    if (!embedUrl) {
      res.status(400).json({ error: "This article has no link to save" });
      return;
    }

    const created = await prisma.userTopic.create({
      data: {
        userId,
        folderId: collection.id,
        userSubjectId: null,
        userTopicGroupId: null,
        title: article.title,
        slug,
        contentType: "LINK",
        sourceUrl: embedUrl,
        contentUrl: marker,
        fileSizeBytes: 0,
        status: "PUBLISHED",
        order,
      },
    });

    scheduleIndexPage(created.id);

    res.json({
      page: {
        id: created.id,
        title: created.title,
        slug: created.slug,
        contentType: created.contentType,
      },
      href: pageHref(collection.slug, null, created.slug),
      alreadySaved: false,
      status: "PUBLISHED",
      saveMode: savePolicy.mode,
      saveReason: savePolicy.reason,
    });
    return;
  }

  const created = await prisma.userTopic.create({
    data: {
      userId,
      folderId: collection.id,
      userSubjectId: null,
      userTopicGroupId: null,
      title: article.title,
      slug,
      contentType:
        article.pdfKey || savePolicy.mode === "download_remote" ? "PDF" : "HTML",
      pdfKey:
        article.pdfKey || savePolicy.mode === "download_remote"
          ? `${docPrefix}/source.pdf`
          : null,
      contentUrl:
        article.contentUrl && savePolicy.mode === "copy_admin"
          ? `${docPrefix}/content.html`
          : null,
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
    saveMode: savePolicy.mode,
    saveReason: savePolicy.reason,
  });

  void finishCurriculumLibraryCopy({
    userId,
    pageId: created.id,
    article: {
      id: article.id,
      pdfKey: article.pdfKey,
      contentUrl: article.contentUrl,
      sourceUrl: article.sourceUrl,
    },
    saveMode: savePolicy.mode,
    docPrefix,
    me,
    log: req.log,
  }).catch((err) => {
    req.log?.error("curriculum.save_async_unhandled", errorFields(err));
  });
});

export default router;
