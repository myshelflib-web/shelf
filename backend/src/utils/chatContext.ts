import prisma from "./prisma.js";

export type ChatContextKind = "LIBRARY" | "NOTEBOOK" | "TOPIC" | "PAGE";

export type ThreadContextFields = {
  contextKind: string;
  contextNotebookId: string | null;
  contextTopicId: string | null;
  contextPageId: string | null;
};

export type ResolvedChatContext = {
  kind: ChatContextKind;
  /** null = search entire library */
  pageIds: string[] | null;
  label: string;
};

function asKind(raw: string | null | undefined): ChatContextKind {
  const k = String(raw ?? "LIBRARY").toUpperCase();
  if (k === "NOTEBOOK" || k === "TOPIC" || k === "PAGE") return k;
  return "LIBRARY";
}

/**
 * Resolve which library pages Study AI may retrieve from for this thread.
 * LIBRARY → null (no filter). Empty array means scope resolved but no pages.
 */
export async function resolveContextPageIds(
  userId: string,
  thread: ThreadContextFields
): Promise<ResolvedChatContext> {
  const kind = asKind(thread.contextKind);

  if (kind === "LIBRARY") {
    return { kind, pageIds: null, label: "All library" };
  }

  if (kind === "PAGE") {
    const pageId = thread.contextPageId;
    if (!pageId) return { kind: "LIBRARY", pageIds: null, label: "All library" };
    const page = await prisma.userTopic.findFirst({
      where: { id: pageId, userId },
      select: {
        id: true,
        title: true,
        userSubject: { select: { name: true } },
        userTopicGroup: { select: { title: true } },
      },
    });
    if (!page) return { kind: "LIBRARY", pageIds: null, label: "All library" };
    const parts = [
      page.userSubject?.name,
      page.userTopicGroup?.title,
      page.title,
    ].filter(Boolean);
    return {
      kind,
      pageIds: [page.id],
      label: parts.join(" · ") || page.title,
    };
  }

  if (kind === "TOPIC") {
    const topicId = thread.contextTopicId;
    if (!topicId) return { kind: "LIBRARY", pageIds: null, label: "All library" };
    const group = await prisma.userTopicGroup.findFirst({
      where: {
        id: topicId,
        userSubject: { userId },
      },
      select: {
        id: true,
        title: true,
        userSubject: { select: { name: true } },
      },
    });
    if (!group) return { kind: "LIBRARY", pageIds: null, label: "All library" };
    const pages = await prisma.userTopic.findMany({
      where: {
        userId,
        userTopicGroupId: group.id,
        status: "PUBLISHED",
      },
      select: { id: true },
    });
    return {
      kind,
      pageIds: pages.map((p) => p.id),
      label: `${group.userSubject.name} · ${group.title}`,
    };
  }

  // NOTEBOOK
  const notebookId = thread.contextNotebookId;
  if (!notebookId) return { kind: "LIBRARY", pageIds: null, label: "All library" };
  const notebook = await prisma.userSubject.findFirst({
    where: { id: notebookId, userId },
    select: { id: true, name: true },
  });
  if (!notebook) return { kind: "LIBRARY", pageIds: null, label: "All library" };
  const pages = await prisma.userTopic.findMany({
    where: {
      userId,
      userSubjectId: notebook.id,
      status: "PUBLISHED",
    },
    select: { id: true },
  });
  return {
    kind: "NOTEBOOK",
    pageIds: pages.map((p) => p.id),
    label: notebook.name,
  };
}

export async function assertChatContextOwned(
  userId: string,
  input: {
    contextKind: ChatContextKind;
    contextNotebookId?: string | null;
    contextTopicId?: string | null;
    contextPageId?: string | null;
  }
): Promise<void> {
  const kind = input.contextKind;
  if (kind === "LIBRARY") return;

  if (kind === "NOTEBOOK") {
    const id = input.contextNotebookId;
    if (!id) throw new Error("Collection required for collection context");
    const n = await prisma.userSubject.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!n) throw new Error("Collection not found");
    return;
  }

  if (kind === "TOPIC") {
    const id = input.contextTopicId;
    if (!id) throw new Error("Topic required for topic context");
    const g = await prisma.userTopicGroup.findFirst({
      where: { id, userSubject: { userId } },
      select: { id: true },
    });
    if (!g) throw new Error("Topic not found");
    return;
  }

  const pageId = input.contextPageId;
  if (!pageId) throw new Error("Page required for page context");
  const page = await prisma.userTopic.findFirst({
    where: { id: pageId, userId },
    select: { id: true },
  });
  if (!page) throw new Error("Page not found");
}
