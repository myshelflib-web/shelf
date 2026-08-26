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
import { resolveContextPageIds } from "../utils/chatContext.js";
import { titleFromQuery, trimThreadToLimit } from "../services/chatThreads.js";
import { truncateText } from "../utils/htmlText.js";

const router = Router();
router.use(authMiddleware);

const SYLLABUS_PROMPT_CHARS = 10_000;

function writeSse(res: Response, event: string, data: unknown) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function loadSyllabus(
  userId: string,
  relevancyDocId: string | null
): Promise<string | null> {
  if (!relevancyDocId) return null;
  const doc = await prisma.studyRelevancyDoc.findFirst({
    where: { id: relevancyDocId, userId },
    select: { body: true },
  });
  return doc?.body ? truncateText(doc.body, SYLLABUS_PROMPT_CHARS) : null;
}

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
      content || (imageBase64 ? "📷 [Image attached]" : "");

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
    const syllabusText = await loadSyllabus(userId, thread.relevancyDocId);

    const result = await answerWithRag({
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
  const llmAbort = new AbortController();
  let clientGone = false;
  req.on("close", () => {
    clientGone = true;
    llmAbort.abort();
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
    const syllabusText = await loadSyllabus(userId, thread.relevancyDocId);

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
      signal: llmAbort.signal,
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
