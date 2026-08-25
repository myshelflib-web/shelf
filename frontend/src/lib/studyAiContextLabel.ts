import type {
  ChatContextKind,
  ChatThreadSummary,
  UserSubject,
} from "@/types";

export function chatContextLabel(
  thread: Pick<
    ChatThreadSummary,
    | "contextKind"
    | "contextNotebookId"
    | "contextTopicId"
    | "contextPageId"
  >,
  notebooks: UserSubject[]
): string {
  const kind = String(thread.contextKind ?? "LIBRARY").toUpperCase();
  if (kind === "LIBRARY" || !thread.contextNotebookId) return "All library";

  const nb = notebooks.find((n) => n.id === thread.contextNotebookId);
  if (!nb) return "All library";

  if (kind === "NOTEBOOK") return nb.name;

  if (kind === "TOPIC" && thread.contextTopicId) {
    const topic = nb.topicGroups?.find((t) => t.id === thread.contextTopicId);
    return topic ? `${nb.name} · ${topic.title}` : nb.name;
  }

  if (kind === "PAGE" && thread.contextPageId) {
    const topic = thread.contextTopicId
      ? nb.topicGroups?.find((t) => t.id === thread.contextTopicId)
      : undefined;
    const page =
      topic?.pages?.find((p) => p.id === thread.contextPageId) ??
      nb.pages?.find((p) => p.id === thread.contextPageId);
    if (page) {
      return topic
        ? `${nb.name} · ${topic.title} · ${page.title}`
        : `${nb.name} · ${page.title}`;
    }
    return nb.name;
  }

  return nb.name;
}

export function normalizeContextKind(raw: string | undefined): ChatContextKind {
  const k = String(raw ?? "LIBRARY").toUpperCase();
  if (k === "NOTEBOOK" || k === "TOPIC" || k === "PAGE") return k;
  return "LIBRARY";
}
