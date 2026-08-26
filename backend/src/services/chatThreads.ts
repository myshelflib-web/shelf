import prisma from "../utils/prisma.js";
import { chatMessageLimit } from "../utils/quotas.js";
import { messageIdsToDelete } from "../utils/chatMessages.js";

export function titleFromQuery(q: string) {
  const t = q.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 47)}…` : t || "New chat";
}

export async function trimThreadToLimit(threadId: string, limit: number) {
  const count = await prisma.chatMessage.count({ where: { threadId } });
  if (count <= limit) return;
  const overflow = count - limit;
  const oldest = await prisma.chatMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: overflow,
    select: { id: true },
  });
  if (oldest.length === 0) return;
  await prisma.chatMessage.deleteMany({
    where: { id: { in: oldest.map((m) => m.id) } },
  });
}

/**
 * Reader Ask AI turns are saved as a normal chat thread so they show up in
 * Study AI history. A page ask reuses the page's thread (one per page) and
 * scopes it to that page; article asks fall back to a library thread.
 */
export async function resolvePageAskThread(input: {
  userId: string;
  threadId?: string;
  userTopicId?: string;
  title: string;
}): Promise<{ id: string; title: string } | null> {
  const { userId } = input;

  if (input.threadId) {
    const existing = await prisma.chatThread.findFirst({
      where: { id: input.threadId, userId },
      select: { id: true, title: true },
    });
    if (existing) return existing;
  }

  if (input.userTopicId) {
    const page = await prisma.userTopic.findFirst({
      where: { id: input.userTopicId, userId },
      select: { id: true, userSubjectId: true, userTopicGroupId: true },
    });
    if (!page) return null;

    const reusable = await prisma.chatThread.findFirst({
      where: { userId, contextKind: "PAGE", contextPageId: page.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    });
    if (reusable) return reusable;

    return prisma.chatThread.create({
      data: {
        userId,
        title: input.title,
        contextKind: "PAGE",
        contextPageId: page.id,
        contextNotebookId: page.userSubjectId,
        contextTopicId: page.userTopicGroupId,
      },
      select: { id: true, title: true },
    });
  }

  return prisma.chatThread.create({
    data: { userId, title: input.title },
    select: { id: true, title: true },
  });
}

/** Persist one reader Ask AI exchange (question + answer) onto a thread. */
export async function savePageAskTurn(input: {
  userId: string;
  threadId: string;
  threadTitle: string;
  question: string;
  answer: string;
  imageBase64?: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });
  if (!user) return;

  const question =
    input.question.trim() ||
    (input.imageBase64 ? "📷 [Image attached]" : "Explain this");

  await prisma.chatMessage.create({
    data: { threadId: input.threadId, role: "user", content: question },
  });
  await prisma.chatMessage.create({
    data: { threadId: input.threadId, role: "assistant", content: input.answer },
  });

  await trimThreadToLimit(input.threadId, chatMessageLimit(user));

  await prisma.chatThread.update({
    where: { id: input.threadId },
    data: {
      title:
        input.threadTitle === "New chat"
          ? titleFromQuery(question)
          : input.threadTitle,
      updatedAt: new Date(),
    },
  });
}

export async function deleteChatMessage(opts: {
  userId: string;
  threadId: string;
  messageId: string;
}): Promise<string[] | null> {
  const thread = await prisma.chatThread.findFirst({
    where: { id: opts.threadId, userId: opts.userId },
    select: { id: true },
  });
  if (!thread) return null;

  const messages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true },
  });
  const ids = messageIdsToDelete(messages, opts.messageId);
  if (!ids) return null;

  await prisma.chatMessage.deleteMany({ where: { id: { in: ids } } });
  await prisma.chatThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });
  return ids;
}
