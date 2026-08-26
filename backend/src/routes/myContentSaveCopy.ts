import { Router, type Request, type Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { scheduleIndexPage } from "../services/libraryIndex.js";
import {
  getFromS3,
  getObjectBuffer,
  uploadToS3,
} from "../services/s3.js";
import { userDocPrefix } from "../utils/docPaths.js";
import { errorFields } from "../utils/logger.js";
import { param } from "../utils/param.js";
import { findAccessiblePage } from "../utils/pageAccess.js";
import {
  uniquePageSlug,
  type PageSlugScope,
} from "../utils/pageScope.js";
import prisma from "../utils/prisma.js";
import { assertStorageRoom, QuotaError } from "../utils/quotas.js";
import { userSelect } from "../utils/publicUser.js";

const router = Router();
router.use(authMiddleware);

/** Save an independent copy of a shared page into the recipient's library. */
router.post("/pages/:id/save-copy", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const access = await findAccessiblePage(userId, param(req, "id"), {
    linkToken: typeof req.body?.t === "string" ? req.body.t : null,
  });
  if (!access || access.role === "OWNER") {
    res.status(403).json({ error: "Nothing to copy" });
    return;
  }

  const subjectId = req.body?.subjectId ? String(req.body.subjectId) : null;
  const topicGroupId = req.body?.topicGroupId
    ? String(req.body.topicGroupId)
    : null;

  let scope: PageSlugScope = { kind: "root", userId };
  let subjectSlug: string | null = null;
  let topicSlug: string | null = null;
  let userSubjectId: string | null = null;
  let userTopicGroupId: string | null = null;

  if (subjectId) {
    const subject = await prisma.userSubject.findFirst({
      where: { id: subjectId, userId },
    });
    if (!subject) {
      res.status(400).json({ error: "Collection not found" });
      return;
    }
    userSubjectId = subject.id;
    subjectSlug = subject.slug;
    if (topicGroupId) {
      const group = await prisma.userTopicGroup.findFirst({
        where: { id: topicGroupId, userSubjectId: subject.id },
      });
      if (!group) {
        res.status(400).json({ error: "Topic not found" });
        return;
      }
      userTopicGroupId = group.id;
      topicSlug = group.slug;
      scope = { kind: "topic", userTopicGroupId: group.id };
    } else {
      scope = { kind: "notebook", userSubjectId: subject.id };
    }
  }

  const src = access.page;
  const bytes = src.fileSizeBytes ?? 0;
  try {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });
    if (!me) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    assertStorageRoom(me, bytes);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }

  const slug = await uniquePageSlug(scope, src.title);
  const docPrefix = userDocPrefix(userId, subjectSlug, topicSlug, slug);
  let pdfKey: string | null = null;
  let contentUrl: string | null = null;

  try {
    if (src.pdfKey) {
      const { buffer } = await getObjectBuffer(src.pdfKey);
      pdfKey = `${docPrefix}/source.pdf`;
      await uploadToS3(pdfKey, buffer, "application/pdf");
    }
    if (src.contentUrl) {
      const html = await getFromS3(src.contentUrl);
      contentUrl = `${docPrefix}/content.html`;
      await uploadToS3(contentUrl, html, "text/html; charset=utf-8");
    }
  } catch (err) {
    req.log?.error("share.save_copy_s3_failed", errorFields(err));
    res.status(500).json({ error: "Could not copy file" });
    return;
  }

  const created = await prisma.userTopic.create({
    data: {
      userId,
      userSubjectId,
      userTopicGroupId,
      title: src.title,
      slug,
      contentType: src.contentType,
      pdfKey,
      contentUrl,
      sourceUrl: src.sourceUrl,
      fileSizeBytes: bytes,
      status: src.status,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { storageUsedBytes: { increment: bytes } },
  });

  if (access.shareId) {
    await prisma.pageShare.update({
      where: { id: access.shareId },
      data: { copiedPageId: created.id },
    });
  }

  scheduleIndexPage(created.id);
  res.status(201).json({
    page: {
      id: created.id,
      title: created.title,
      slug: created.slug,
      contentType: created.contentType,
    },
  });
});

export default router;
