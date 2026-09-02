import {
  applyBulkDeleteToTree,
  mergeExplorerTreeWithPendingDeletes,
} from "@/lib/explorerBulkDeleteTree";
import type { buildBulkDeletePayload } from "@/lib/explorerSelection";
import { UserPageSummary, UserSubject } from "@/types";

export type PendingExplorerDeletePayload = ReturnType<
  typeof buildBulkDeletePayload
>;

const pending: PendingExplorerDeletePayload[] = [];

function payloadMatches(
  a: PendingExplorerDeletePayload,
  b: PendingExplorerDeletePayload
): boolean {
  return (
    a.subjectIds.join() === b.subjectIds.join() &&
    a.pageIds.join() === b.pageIds.join() &&
    a.topicGroups
      .map((entry) => `${entry.subjectId}:${entry.groupId}`)
      .join() ===
      b.topicGroups.map((entry) => `${entry.subjectId}:${entry.groupId}`).join()
  );
}

export function pushPendingExplorerDelete(
  payload: PendingExplorerDeletePayload
) {
  if (pending.some((entry) => payloadMatches(entry, payload))) return;
  pending.push(payload);
}

export function removePendingExplorerDelete(
  payload: PendingExplorerDeletePayload
) {
  const index = pending.findIndex((entry) => payloadMatches(entry, payload));
  if (index >= 0) pending.splice(index, 1);
}

export function getPendingExplorerDeletes(): readonly PendingExplorerDeletePayload[] {
  return pending;
}

/** Test-only: clear in-flight delete payloads between cases. */
export function resetPendingExplorerDeletesForTests() {
  pending.length = 0;
}

function payloadStillVisible(
  payload: PendingExplorerDeletePayload,
  subjects: UserSubject[],
  rootPages: UserPageSummary[]
): boolean {
  for (const id of payload.subjectIds) {
    if (subjects.some((subject) => subject.id === id)) return true;
  }
  for (const { subjectId, groupId } of payload.topicGroups) {
    const subject = subjects.find((entry) => entry.id === subjectId);
    if (subject?.topicGroups?.some((group) => group.id === groupId)) {
      return true;
    }
  }
  for (const id of payload.pageIds) {
    if (rootPages.some((page) => page.id === id)) return true;
    for (const subject of subjects) {
      if (subject.pages?.some((page) => page.id === id)) return true;
      for (const group of subject.topicGroups ?? []) {
        if (group.pages.some((page) => page.id === id)) return true;
      }
    }
  }
  return false;
}

/** Drop pending payloads once the server tree no longer contains deleted ids. */
export function prunePendingExplorerDeletes(
  subjects: UserSubject[],
  rootPages: UserPageSummary[]
) {
  for (let i = pending.length - 1; i >= 0; i--) {
    const entry = pending[i];
    if (!entry || !payloadStillVisible(entry, subjects, rootPages)) {
      pending.splice(i, 1);
    }
  }
}

export function mergeExplorerTreeWithPending(
  subjects: UserSubject[],
  rootPages: UserPageSummary[]
): { subjects: UserSubject[]; rootPages: UserPageSummary[] } {
  const merged = mergeExplorerTreeWithPendingDeletes(
    subjects,
    rootPages,
    [...pending]
  );
  // Keep pending until the server response no longer includes deleted ids.
  prunePendingExplorerDeletes(subjects, rootPages);
  return merged;
}

export function applyPendingDeletesToSubjects(
  subjects: UserSubject[]
): UserSubject[] {
  return mergeExplorerTreeWithPendingDeletes(subjects, [], [...pending])
    .subjects;
}
