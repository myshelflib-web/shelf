import { api } from "@/lib/api";
import { findTopicLocation } from "@/lib/libraryMove";
import type { UserSubject } from "@/types";

/** Replace (or append) a subject in a working explorer list. */
export function replaceSubjectInList(
  list: UserSubject[],
  subject: UserSubject
): UserSubject[] {
  const idx = list.findIndex(
    (s) => s.id === subject.id || s.slug === subject.slug
  );
  if (idx < 0) return [...list, subject];
  const next = list.slice();
  next[idx] = subject;
  return next;
}

async function fetchFullSubject(
  list: UserSubject[],
  subjectId: string
): Promise<UserSubject | null> {
  const stub = list.find((s) => s.id === subjectId);
  if (!stub?.slug) return null;
  try {
    const { subject } = await api.myContent.getSubject(stub.slug);
    return subject;
  } catch {
    return null;
  }
}

/**
 * Slim list stubs omit nested folders. Moving into a topic (or nesting under
 * one) requires that folder in the local tree — fetch the full subject first.
 */
export async function ensureSubjectsForPageMove(
  subjects: UserSubject[],
  targetSubjectId: string | null,
  targetTopicGroupId: string | null
): Promise<{ subjects: UserSubject[]; hydrated: UserSubject[] }> {
  const hydrated: UserSubject[] = [];
  if (!targetSubjectId || !targetTopicGroupId) {
    return { subjects, hydrated };
  }
  const target = subjects.find((s) => s.id === targetSubjectId);
  if (target && findTopicLocation([target], targetTopicGroupId)) {
    return { subjects, hydrated };
  }
  const full = await fetchFullSubject(subjects, targetSubjectId);
  if (!full) return { subjects, hydrated };
  hydrated.push(full);
  return { subjects: replaceSubjectInList(subjects, full), hydrated };
}

export async function ensureSubjectsForTopicMove(
  subjects: UserSubject[],
  targetSubjectId: string,
  targetParentId: string | null
): Promise<{ subjects: UserSubject[]; hydrated: UserSubject[] }> {
  const hydrated: UserSubject[] = [];
  const nestUnder =
    targetParentId && targetParentId !== targetSubjectId
      ? targetParentId
      : null;
  if (!nestUnder) return { subjects, hydrated };

  const target = subjects.find((s) => s.id === targetSubjectId);
  if (target && findTopicLocation([target], nestUnder)) {
    return { subjects, hydrated };
  }
  const full = await fetchFullSubject(subjects, targetSubjectId);
  if (!full) return { subjects, hydrated };
  hydrated.push(full);
  return { subjects: replaceSubjectInList(subjects, full), hydrated };
}
