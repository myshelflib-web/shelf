import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { parsePublicHttpUrl } from "../utils/publicUrl.js";
import { QuotaError } from "../utils/quotas.js";
import { errorFields } from "../utils/logger.js";
import { parseYoutubeUrl } from "../utils/youtubeUrl.js";
import {
  importYoutube,
  type YoutubePageParent,
} from "../services/youtubeImport.js";

const router = Router();

router.use(authMiddleware);

function rootParent(userId: string): YoutubePageParent {
  return {
    userId,
    scope: { kind: "root", userId },
    userSubjectId: null,
    userTopicGroupId: null,
    subjectSlug: null,
    groupSlug: null,
  };
}

async function notebookParent(
  userId: string,
  subjectId: string
): Promise<YoutubePageParent | null> {
  const subject = await prisma.userFolder.findFirst({
    where: { id: subjectId, userId, parentId: null },
  });
  if (!subject) return null;
  return {
    userId,
    scope: { kind: "notebook", userSubjectId: subject.id },
    userSubjectId: subject.id,
    userTopicGroupId: null,
    subjectSlug: subject.slug,
    groupSlug: null,
  };
}

async function topicParent(
  userId: string,
  subjectId: string,
  groupId: string
): Promise<YoutubePageParent | null> {
  const subject = await prisma.userFolder.findFirst({
    where: { id: subjectId, userId, parentId: null },
  });
  const group = await prisma.userFolder.findFirst({
    where: { id: groupId, userId, parentId: subject?.id },
  });
  if (!subject || !group) return null;
  return {
    userId,
    scope: { kind: "topic", userTopicGroupId: group.id },
    userSubjectId: subject.id,
    userTopicGroupId: group.id,
    subjectSlug: subject.slug,
    groupSlug: group.slug,
  };
}

router.post("/youtube", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const sourceUrl = parsePublicHttpUrl(String(req.body?.sourceUrl ?? ""));
  if (!sourceUrl) {
    res.status(400).json({ error: "Paste a public YouTube video or playlist link." });
    return;
  }
  const target = parseYoutubeUrl(sourceUrl);
  if (!target) {
    res.status(400).json({ error: "That does not look like a YouTube link." });
    return;
  }

  const subjectId = req.body?.notebookId ? String(req.body.notebookId) : "";
  const topicId = req.body?.topicId ? String(req.body.topicId) : "";
  const title = typeof req.body?.title === "string" ? req.body.title : "";

  try {
    let parent: YoutubePageParent | null = rootParent(userId);
    if (subjectId && topicId) {
      parent = await topicParent(userId, subjectId, topicId);
    } else if (subjectId) {
      parent = await notebookParent(userId, subjectId);
    }
    if (!parent) {
      res.status(404).json({ error: "Collection or topic not found" });
      return;
    }

    const result = await importYoutube({
      parent,
      title,
      target,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Could not import YouTube";
    req.log?.error("my_content.youtube_import_failed", errorFields(err));
    res.status(400).json({ error: message });
  }
});

export default router;
