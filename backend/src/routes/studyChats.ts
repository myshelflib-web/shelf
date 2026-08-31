import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { chatMessageLimit } from "../utils/quotas.js";
import {
  assertChatContextOwned,
  type ChatContextKind,
} from "../utils/chatContext.js";
import {
  deleteChatMessage,
  truncateChatMessages,
} from "../services/chatThreads.js";
import { reqLog, studyFlow } from "../utils/flowLog.js";

const router = Router();
router.use(authMiddleware);

const threadContextSelect = {
  id: true,
  title: true,
  contextKind: true,
  contextNotebookId: true,
  contextTopicId: true,
  contextPageId: true,
  relevancyDocId: true,
  createdAt: true,
  updatedAt: true,
  relevancyDoc: {
    select: { id: true, title: true, source: true, updatedAt: true },
  },
} as const;

router.get("/chats", async (req: Request, res: Response) => {
  const pageId = String(req.query.pageId ?? "").trim();
  const threads = await prisma.chatThread.findMany({
    where: {
      userId: req.user!.userId,
      ...(pageId ? { contextKind: "PAGE", contextPageId: pageId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: threadContextSelect,
  });
  res.json({ threads });
});

router.post("/chats", async (req: Request, res: Response) => {
  const title = String((req.body as { title?: string }).title ?? "").trim();
  const thread = await prisma.chatThread.create({
    data: {
      userId: req.user!.userId,
      title: title || "New chat",
    },
    select: threadContextSelect,
  });
  studyFlow.threadCreated(reqLog(req), { threadId: thread.id, title: thread.title });
  res.status(201).json({ thread });
});

router.get("/chats/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });
  const limit = user ? chatMessageLimit(user) : 30;

  const thread = await prisma.chatThread.findFirst({
    where: { id: param(req, "id"), userId },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: limit,
      },
      relevancyDoc: {
        select: { id: true, title: true, source: true, updatedAt: true },
      },
    },
  });
  if (!thread) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  res.json({
    thread: {
      ...thread,
      messages: [...thread.messages].reverse(),
      memoryLimit: limit,
    },
  });
});

router.patch("/chats/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const existing = await prisma.chatThread.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  const body = req.body as {
    title?: string;
    contextKind?: string;
    contextNotebookId?: string | null;
    contextTopicId?: string | null;
    contextPageId?: string | null;
    relevancyDocId?: string | null;
  };

  const data: {
    title?: string;
    contextKind?: string;
    contextNotebookId?: string | null;
    contextTopicId?: string | null;
    contextPageId?: string | null;
    relevancyDocId?: string | null;
  } = {};

  if (body.title !== undefined) {
    const title = String(body.title).trim().slice(0, 120);
    if (title) data.title = title;
  }

  if (body.contextKind !== undefined) {
    const kind = String(body.contextKind).toUpperCase() as ChatContextKind;
    if (!["LIBRARY", "NOTEBOOK", "TOPIC", "PAGE"].includes(kind)) {
      res.status(400).json({ error: "Invalid contextKind" });
      return;
    }
    try {
      await assertChatContextOwned(userId, {
        contextKind: kind,
        contextNotebookId: body.contextNotebookId ?? null,
        contextTopicId: body.contextTopicId ?? null,
        contextPageId: body.contextPageId ?? null,
      });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Invalid context",
      });
      return;
    }
    data.contextKind = kind;
    data.contextNotebookId =
      kind === "NOTEBOOK" || kind === "TOPIC" || kind === "PAGE"
        ? body.contextNotebookId ?? null
        : null;
    data.contextTopicId =
      kind === "TOPIC" || kind === "PAGE" ? body.contextTopicId ?? null : null;
    data.contextPageId = kind === "PAGE" ? body.contextPageId ?? null : null;

    if (kind === "TOPIC" && data.contextTopicId && !data.contextNotebookId) {
      const group = await prisma.userTopicGroup.findFirst({
        where: { id: data.contextTopicId, userSubject: { userId } },
        select: { userSubjectId: true },
      });
      if (group) data.contextNotebookId = group.userSubjectId;
    }
    if (kind === "PAGE" && data.contextPageId) {
      const page = await prisma.userTopic.findFirst({
        where: { id: data.contextPageId, userId },
        select: { userSubjectId: true, userTopicGroupId: true },
      });
      if (page) {
        data.contextNotebookId = page.userSubjectId;
        data.contextTopicId = page.userTopicGroupId;
      }
    }
  }

  if (body.relevancyDocId !== undefined) {
    if (body.relevancyDocId === null || body.relevancyDocId === "") {
      data.relevancyDocId = null;
    } else {
      const doc = await prisma.studyRelevancyDoc.findFirst({
        where: { id: String(body.relevancyDocId), userId },
        select: { id: true },
      });
      if (!doc) {
        res.status(400).json({ error: "Relevancy doc not found" });
        return;
      }
      data.relevancyDocId = doc.id;
    }
  }

  const thread = await prisma.chatThread.update({
    where: { id: existing.id },
    data,
    select: threadContextSelect,
  });
  res.json({ thread });
});

router.delete("/chats/:id", async (req: Request, res: Response) => {
  const existing = await prisma.chatThread.findFirst({
    where: { id: param(req, "id"), userId: req.user!.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  await prisma.chatThread.delete({ where: { id: existing.id } });
  studyFlow.threadDeleted(reqLog(req), { threadId: existing.id });
  res.json({ success: true });
});

router.delete("/chats/:id/messages/:messageId", async (req: Request, res: Response) => {
  const deletedIds = await deleteChatMessage({
    userId: req.user!.userId,
    threadId: param(req, "id"),
    messageId: param(req, "messageId"),
  });
  if (!deletedIds) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.json({ success: true, deletedIds });
});

/** Truncate a thread from a user message (or keep the first N) for Cursor-style edit. */
router.post("/chats/:id/messages/truncate", async (req: Request, res: Response) => {
  const body = req.body as { messageId?: string; keepCount?: number };
  const messageId =
    typeof body.messageId === "string" ? body.messageId.trim() : "";
  const keepCount =
    body.keepCount === undefined ? undefined : Number(body.keepCount);

  if (!messageId && keepCount === undefined) {
    res.status(400).json({ error: "messageId or keepCount required" });
    return;
  }
  if (keepCount !== undefined && (!Number.isInteger(keepCount) || keepCount < 0)) {
    res.status(400).json({ error: "keepCount must be a non-negative integer" });
    return;
  }

  const deletedIds = await truncateChatMessages({
    userId: req.user!.userId,
    threadId: param(req, "id"),
    messageId: messageId || undefined,
    keepCount,
  });
  if (!deletedIds) {
    res.status(404).json({ error: "Message not found" });
    return;
  }
  res.json({ success: true, deletedIds });
});

export default router;
