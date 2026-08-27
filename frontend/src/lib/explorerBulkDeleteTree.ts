import { UserPageSummary, UserSubject } from "@/types";
import { getNotebookPages, getTopicGroups } from "@/lib/myContentTree";
import type { buildBulkDeletePayload } from "@/lib/explorerSelection";

type BulkDeletePayload = ReturnType<typeof buildBulkDeletePayload>;

export function applyBulkDeleteToTree(
  payload: BulkDeletePayload,
  subjects: UserSubject[],
  rootPages: UserPageSummary[]
): { subjects: UserSubject[]; rootPages: UserPageSummary[] } {
  const subjectIdSet = new Set(payload.subjectIds);
  const topicGroupKeys = new Set(
    payload.topicGroups.map((tg) => `${tg.subjectId}:${tg.groupId}`)
  );
  const pageIdSet = new Set(payload.pageIds);

  const nextSubjects = subjects
    .filter((subject) => !subjectIdSet.has(subject.id))
    .map((subject) => ({
      ...subject,
      topicGroups: getTopicGroups(subject)
        .filter((group) => !topicGroupKeys.has(`${subject.id}:${group.id}`))
        .map((group) => ({
          ...group,
          pages: group.pages.filter((page) => !pageIdSet.has(page.id)),
        })),
      pages: getNotebookPages(subject).filter((page) => !pageIdSet.has(page.id)),
    }));

  const nextRootPages = rootPages.filter((page) => !pageIdSet.has(page.id));

  return { subjects: nextSubjects, rootPages: nextRootPages };
}
