import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import {
  answerWithRag,
  streamAnswerWithRag,
  type LibraryCitation,
} from "../services/rag.js";
import {
  QuotaError,
  assertLlmRoom,
  chatHistoryWindow,
  chatMessageLimit,
  estimateTokens,
  shouldResetLlmWindow,
} from "../utils/quotas.js";
import {
  assertChatContextOwned,
  resolveContextPageIds,
  type ChatContextKind,
} from "../utils/chatContext.js";
import { titleFromQuery, trimThreadToLimit } from "../services/chatThreads.js";
import { truncateText } from "../utils/htmlText.js";

const router = Router();
router.use(authMiddleware);

const SYLLABUS_PROMPT_CHARS = 10_000;

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

function writeSse(res: Response, event: string, data: unknown) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

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

    // For TOPIC, ensure notebook id is filled from the topic when omitted
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
  res.json({ success: true });
});

router.post("/chats/:id/messages", async (req: Request, res: Response) => {
  const body = req.body as { content?: string; imageBase64?: string };
  const content = String(body.content ?? "").trim();
  const imageBase64 = body.imageBase64;
  if (!content && !imageBase64?.startsWith("data:image/")) {
    res.status(400).json({ error: "content or image required" });
    return;
  }

  const userId = req.user!.userId;
  const thread = await prisma.chatThread.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!thread) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      studyGoal: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      llmTokensUsed: true,
      llmTokensResetAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const memoryLimit = chatMessageLimit(user);
  const historyWindow = chatHistoryWindow(user);

  try {
    let tokensUsed = user.llmTokensUsed;
    if (shouldResetLlmWindow(user.llmTokensResetAt)) {
      await prisma.user.update({
        where: { id: userId },
        data: { llmTokensUsed: 0, llmTokensResetAt: new Date() },
      });
      tokensUsed = 0;
    }
    assertLlmRoom(
      { ...user, llmTokensUsed: tokensUsed },
      estimateTokens(content || "image") + 1200
    );

    const displayContent =
      content ||
      (imageBase64 ? "📷 [Image attached]" : "");

    const prior = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "desc" },
      take: historyWindow,
    });
    const history = [...prior]
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const userMsg = await prisma.chatMessage.create({
      data: { threadId: thread.id, role: "user", content: displayContent },
    });

    const scope = await resolveContextPageIds(userId, thread);
    let syllabusText: string | null = null;
    if (thread.relevancyDocId) {
      const doc = await prisma.studyRelevancyDoc.findFirst({
        where: { id: thread.relevancyDocId, userId },
        select: { body: true },
      });
      if (doc?.body) {
        syllabusText = truncateText(doc.body, SYLLABUS_PROMPT_CHARS);
      }
    }

    const result = await answerWithRag({
      userId,
      query: content || "Explain the attached image using my library when relevant.",
      studyGoal: user.studyGoal ?? "GENERAL",
      history,
      imageBase64,
      historyLimit: historyWindow,
      pageIds: scope.pageIds,
      scopeLabel: scope.label,
      syllabusText,
    });

    const assistantMsg = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: "assistant",
        content: result.answer,
        citations: result.citations,
      },
    });

    await trimThreadToLimit(thread.id, memoryLimit);

    const nextTitle =
      thread.title === "New chat"
        ? titleFromQuery(content || "Image question")
        : thread.title;

    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { title: nextTitle, updatedAt: new Date() },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { llmTokensUsed: { increment: result.tokens } },
    });

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      title: nextTitle,
      matchCount: result.matchCount,
      memoryLimit,
    });
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    const message = err instanceof Error ? err.message : "Study AI failed";
    res.status(503).json({ error: message });
  }
});

/** Cursor-style SSE: library search status + token deltas, then persisted messages. */
router.post("/chats/:id/messages/stream", async (req: Request, res: Response) => {
  const body = req.body as { content?: string; imageBase64?: string };
  const content = String(body.content ?? "").trim();
  const imageBase64 = body.imageBase64;
  if (!content && !imageBase64?.startsWith("data:image/")) {
    res.status(400).json({ error: "content or image required" });
    return;
  }

  const userId = req.user!.userId;
  const thread = await prisma.chatThread.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!thread) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      studyGoal: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      llmTokensUsed: true,
      llmTokensResetAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof (res as Response & { flushHeaders?: () => void }).flushHeaders === "function") {
    (res as Response & { flushHeaders: () => void }).flushHeaders();
  }

  const send = (event: string, data: unknown) => writeSse(res, event, data);
  let clientGone = false;
  req.on("close", () => {
    clientGone = true;
  });

  const memoryLimit = chatMessageLimit(user);
  const historyWindow = chatHistoryWindow(user);
  const displayContent = content || (imageBase64 ? "📷 [Image attached]" : "");
  const nextTitle =
    thread.title === "New chat"
      ? titleFromQuery(content || "Image question")
      : thread.title;

  try {
    send("status", { stage: "starting", detail: "Starting Study AI…" });

    let tokensUsed = user.llmTokensUsed;
    if (shouldResetLlmWindow(user.llmTokensResetAt)) {
      await prisma.user.update({
        where: { id: userId },
        data: { llmTokensUsed: 0, llmTokensResetAt: new Date() },
      });
      tokensUsed = 0;
    }
    assertLlmRoom(
      { ...user, llmTokensUsed: tokensUsed },
      estimateTokens(content || "image") + 1200
    );

    const prior = await prisma.chatMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: "desc" },
      take: historyWindow,
    });
    const history = [...prior]
      .reverse()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const userMsg = await prisma.chatMessage.create({
      data: { threadId: thread.id, role: "user", content: displayContent },
    });

    const scope = await resolveContextPageIds(userId, thread);
    let syllabusText: string | null = null;
    if (thread.relevancyDocId) {
      const doc = await prisma.studyRelevancyDoc.findFirst({
        where: { id: thread.relevancyDocId, userId },
        select: { body: true },
      });
      if (doc?.body) {
        syllabusText = truncateText(doc.body, SYLLABUS_PROMPT_CHARS);
      }
    }

    let answer = "";
    let citations: LibraryCitation[] = [];
    let matchCount = 0;
    let tokens = 0;

    for await (const ev of streamAnswerWithRag({
      userId,
      query:
        content ||
        "Explain the attached image using my library when relevant.",
      studyGoal: user.studyGoal ?? "GENERAL",
      history,
      imageBase64,
      historyLimit: historyWindow,
      pageIds: scope.pageIds,
      scopeLabel: scope.label,
      syllabusText,
    })) {
      if (clientGone) break;
      if (ev.type === "status") {
        send("status", {
          stage: ev.stage,
          detail: ev.detail,
          citations: ev.citations,
        });
      } else if (ev.type === "delta") {
        answer += ev.text;
        send("delta", { text: ev.text });
      } else {
        answer = ev.answer;
        citations = ev.citations;
        matchCount = ev.matchCount;
        tokens = ev.tokens;
        send("status", {
          stage: "finishing",
          detail: `Done · ${ev.model}`,
        });
      }
    }

    if (!answer.trim() && !clientGone) {
      send("error", { message: "Study AI returned an empty response.", status: 503 });
      res.end();
      return;
    }

    const assistantMsg = answer.trim()
      ? await prisma.chatMessage.create({
          data: {
            threadId: thread.id,
            role: "assistant",
            content: answer,
            citations,
          },
        })
      : null;

    await trimThreadToLimit(thread.id, memoryLimit);
    await prisma.chatThread.update({
      where: { id: thread.id },
      data: { title: nextTitle, updatedAt: new Date() },
    });
    if (tokens > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { llmTokensUsed: { increment: tokens } },
      });
    }

    if (!clientGone && assistantMsg) {
      send("done", {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        title: nextTitle,
        matchCount,
        memoryLimit,
      });
    }
    res.end();
  } catch (err) {
    const status = err instanceof QuotaError ? err.status : 503;
    send("error", {
      message: err instanceof Error ? err.message : "Study AI failed",
      status,
    });
    res.end();
  }
});

export default router;
