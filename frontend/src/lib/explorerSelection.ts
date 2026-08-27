export type ExplorerItemKind = "subject" | "topic" | "page";

export type ExplorerSelectionKey =
  | `subject:${string}`
  | `topic:${string}:${string}`
  | `page:${string}`;

export type ExplorerSelectionItem = {
  key: ExplorerSelectionKey;
  kind: ExplorerItemKind;
  label: string;
  subjectId?: string;
  groupId?: string;
  pageId?: string;
};

export function subjectSelectionKey(id: string): ExplorerSelectionKey {
  return `subject:${id}`;
}

export function topicSelectionKey(
  subjectId: string,
  groupId: string
): ExplorerSelectionKey {
  return `topic:${subjectId}:${groupId}`;
}

export function pageSelectionKey(id: string): ExplorerSelectionKey {
  return `page:${id}`;
}

export function toggleSelectionKey(
  selected: Set<ExplorerSelectionKey>,
  key: ExplorerSelectionKey
): Set<ExplorerSelectionKey> {
  const next = new Set(selected);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}

export function buildBulkDeletePayload(selected: Set<ExplorerSelectionKey>) {
  const subjectIds: string[] = [];
  const topicGroups: { subjectId: string; groupId: string }[] = [];
  const pageIds: string[] = [];

  for (const key of selected) {
    if (key.startsWith("subject:")) {
      subjectIds.push(key.slice("subject:".length));
    } else if (key.startsWith("topic:")) {
      const rest = key.slice("topic:".length);
      const sep = rest.indexOf(":");
      if (sep === -1) continue;
      topicGroups.push({
        subjectId: rest.slice(0, sep),
        groupId: rest.slice(sep + 1),
      });
    } else if (key.startsWith("page:")) {
      pageIds.push(key.slice("page:".length));
    }
  }

  return { subjectIds, topicGroups, pageIds };
}

export function buildSelectionLabels(
  subjects: import("@/types").UserSubject[],
  rootPages: import("@/types").UserPageSummary[]
): Map<ExplorerSelectionKey, string> {
  const map = new Map<ExplorerSelectionKey, string>();
  for (const subject of subjects) {
    map.set(subjectSelectionKey(subject.id), subject.name);
    for (const group of subject.topicGroups ?? []) {
      map.set(topicSelectionKey(subject.id, group.id), group.title);
      for (const page of group.pages) {
        map.set(pageSelectionKey(page.id), page.title);
      }
    }
    for (const page of subject.pages ?? []) {
      map.set(pageSelectionKey(page.id), page.title);
    }
  }
  for (const page of rootPages) {
    map.set(pageSelectionKey(page.id), page.title);
  }
  return map;
}

export function summarizeBulkDelete(
  selected: Set<ExplorerSelectionKey>,
  labels: Map<ExplorerSelectionKey, string>
) {
  const items: { key: ExplorerSelectionKey; label: string; kind: ExplorerItemKind }[] =
    [];
  for (const key of selected) {
    const label = labels.get(key);
    if (!label) continue;
    if (key.startsWith("subject:")) {
      items.push({ key, label, kind: "subject" });
    } else if (key.startsWith("topic:")) {
      items.push({ key, label, kind: "topic" });
    } else {
      items.push({ key, label, kind: "page" });
    }
  }
  items.sort((a, b) => a.label.localeCompare(b.label));
  return items;
}
