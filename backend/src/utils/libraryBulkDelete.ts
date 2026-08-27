import prisma from "./prisma.js";

export type BulkDeleteTopicGroupRef = { subjectId: string; groupId: string };

export type BulkDeleteInput = {
  subjectIds?: string[];
  topicGroups?: BulkDeleteTopicGroupRef[];
  pageIds?: string[];
};

export function normalizeBulkDeleteInput(input: BulkDeleteInput) {
  const subjectIds = [...new Set(input.subjectIds ?? [])];
  const subjectIdSet = new Set(subjectIds);
  const topicGroups = (input.topicGroups ?? []).filter(
    (tg) => !subjectIdSet.has(tg.subjectId)
  );
  const topicGroupKeys = new Set(
    topicGroups.map((tg) => `${tg.subjectId}:${tg.groupId}`)
  );
  const pageIds = [...new Set(input.pageIds ?? [])];
  return { subjectIds, topicGroups, topicGroupKeys, pageIds };
}

export async function loadBulkDeleteSubjects(userId: string, subjectIds: string[]) {
  if (!subjectIds.length) return [];
  return prisma.userSubject.findMany({
    where: { userId, id: { in: subjectIds } },
    include: {
      topics: true,
      topicGroups: { include: { pages: true } },
    },
  });
}

export async function loadBulkDeleteTopicGroups(
  userId: string,
  topicGroups: BulkDeleteTopicGroupRef[]
) {
  if (!topicGroups.length) return [];
  const subjectIds = [...new Set(topicGroups.map((tg) => tg.subjectId))];
  const subjects = await prisma.userSubject.findMany({
    where: { userId, id: { in: subjectIds } },
    include: {
      topicGroups: {
        where: { id: { in: topicGroups.map((tg) => tg.groupId) } },
        include: { pages: true },
      },
    },
  });
  return subjects.flatMap((s) => s.topicGroups);
}

export async function loadBulkDeletePages(userId: string, pageIds: string[]) {
  if (!pageIds.length) return [];
  return prisma.userTopic.findMany({
    where: { userId, id: { in: pageIds } },
  });
}

export function pageCoveredByBulkDelete(
  page: { id: string; userSubjectId: string | null; userTopicGroupId: string | null },
  subjectIdSet: Set<string>,
  topicGroupKeys: Set<string>
) {
  if (page.userSubjectId && subjectIdSet.has(page.userSubjectId)) return true;
  if (
    page.userSubjectId &&
    page.userTopicGroupId &&
    topicGroupKeys.has(`${page.userSubjectId}:${page.userTopicGroupId}`)
  ) {
    return true;
  }
  return false;
}
