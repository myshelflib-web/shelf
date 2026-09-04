import prisma from "./prisma.js";

export type BulkDeleteTopicGroupRef = { subjectId: string; groupId: string };

export type BulkDeleteInput = {
  subjectIds?: string[];
  topicGroups?: BulkDeleteTopicGroupRef[];
  pageIds?: string[];
};

export type BulkDeleteFolderBundle = {
  id: string;
  pages: {
    id: string;
    pdfKey: string | null;
    contentUrl: string | null;
    fileSizeBytes: number | null;
  }[];
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

async function collectDescendantFolderIds(
  userId: string,
  rootIds: string[]
): Promise<Set<string>> {
  const include = new Set(rootIds);
  if (!rootIds.length) return include;
  const folders = await prisma.userFolder.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  });
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && include.has(f.parentId) && !include.has(f.id)) {
        include.add(f.id);
        grew = true;
      }
    }
  }
  return include;
}

/** Root folders (collections) selected for bulk delete, with all descendant files. */
export async function loadBulkDeleteSubjects(
  userId: string,
  subjectIds: string[]
): Promise<BulkDeleteFolderBundle[]> {
  if (!subjectIds.length) return [];
  const roots = await prisma.userFolder.findMany({
    where: { userId, parentId: null, id: { in: subjectIds } },
    select: { id: true },
  });
  if (roots.length !== subjectIds.length) return [];

  const bundles: BulkDeleteFolderBundle[] = [];
  for (const root of roots) {
    const folderIds = await collectDescendantFolderIds(userId, [root.id]);
    const pages = await prisma.userTopic.findMany({
      where: { userId, folderId: { in: [...folderIds] } },
      select: { id: true, pdfKey: true, contentUrl: true, fileSizeBytes: true },
    });
    bundles.push({ id: root.id, pages });
  }
  return bundles;
}

/** Nested folders (topics) selected for bulk delete. */
export async function loadBulkDeleteTopicGroups(
  userId: string,
  topicGroups: BulkDeleteTopicGroupRef[]
): Promise<BulkDeleteFolderBundle[]> {
  if (!topicGroups.length) return [];
  const results: BulkDeleteFolderBundle[] = [];

  for (const tg of topicGroups) {
    const parent = await prisma.userFolder.findFirst({
      where: { id: tg.subjectId, userId, parentId: null },
      select: { id: true },
    });
    if (!parent) continue;
    const group = await prisma.userFolder.findFirst({
      where: { id: tg.groupId, userId },
      select: { id: true, parentId: true },
    });
    if (!group || group.parentId === null) continue;

    const underRoot = await collectDescendantFolderIds(userId, [parent.id]);
    if (!underRoot.has(group.id)) continue;

    const folderIds = await collectDescendantFolderIds(userId, [group.id]);
    const pages = await prisma.userTopic.findMany({
      where: { userId, folderId: { in: [...folderIds] } },
      select: { id: true, pdfKey: true, contentUrl: true, fileSizeBytes: true },
    });
    results.push({ id: group.id, pages });
  }
  return results;
}

export async function loadBulkDeletePages(userId: string, pageIds: string[]) {
  if (!pageIds.length) return [];
  return prisma.userTopic.findMany({
    where: { userId, id: { in: pageIds } },
  });
}

export function pageCoveredByBulkDelete(
  page: {
    id: string;
    folderId?: string | null;
    userSubjectId: string | null;
    userTopicGroupId: string | null;
  },
  subjectIdSet: Set<string>,
  topicGroupKeys: Set<string>,
  coveredFolderIds?: Set<string>
) {
  if (page.folderId && coveredFolderIds?.has(page.folderId)) return true;
  if (page.folderId && subjectIdSet.has(page.folderId)) return true;
  for (const key of topicGroupKeys) {
    const groupId = key.split(":")[1];
    if (groupId && page.folderId === groupId) return true;
  }
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
