export const SHELF_REORDER_MIME = "application/x-shelf-library-reorder";

export type ReorderDragKind = "subject" | "topic";

export type ReorderDragPayload = {
  kind: ReorderDragKind;
  id: string;
  subjectId?: string;
};

export function parseReorderDrag(data: string): ReorderDragPayload | null {
  try {
    const parsed = JSON.parse(data) as ReorderDragPayload;
    if (parsed?.kind !== "subject" && parsed?.kind !== "topic") return null;
    if (typeof parsed.id !== "string") return null;
    if (parsed.kind === "topic" && typeof parsed.subjectId !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Move draggedId before targetId in the list (or to end if target is null). */
export function reorderBefore(
  ids: string[],
  draggedId: string,
  targetId: string | null
): string[] {
  if (draggedId === targetId) return ids;
  const rest = ids.filter((id) => id !== draggedId);
  if (!targetId) return [...rest, draggedId];
  const idx = rest.indexOf(targetId);
  if (idx === -1) return ids;
  rest.splice(idx, 0, draggedId);
  return rest;
}

export function reorderSubjectsInTree(
  subjects: import("@/types").UserSubject[],
  orderedIds: string[]
): import("@/types").UserSubject[] {
  const byId = new Map(subjects.map((s) => [s.id, s]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter((s): s is import("@/types").UserSubject => s != null);
}

export function reorderTopicsInSubject(
  subject: import("@/types").UserSubject,
  orderedIds: string[]
): import("@/types").UserSubject {
  const groups = subject.topicGroups ?? [];
  const byId = new Map(groups.map((g) => [g.id, g]));
  return {
    ...subject,
    topicGroups: orderedIds
      .map((id) => byId.get(id))
      .filter((g): g is NonNullable<typeof g> => g != null),
  };
}

export function patchSubjectsOrder(
  subjects: import("@/types").UserSubject[],
  subjectId: string,
  orderedGroupIds: string[]
): import("@/types").UserSubject[] {
  return subjects.map((s) =>
    s.id === subjectId ? reorderTopicsInSubject(s, orderedGroupIds) : s
  );
}
