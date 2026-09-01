import prisma from "./prisma.js";
import {
  findPageBySlug,
  nextPageOrder,
  pageOrderWhere,
  uniquePageSlug,
  type PageSlugScope,
} from "./pageScope.js";
import { reorderBefore } from "./libraryReorder.js";
import { folderAncestors } from "./folderPath.js";
import { uniqueFolderSlug } from "./fileScope.js";

export type MovePageTarget = {
  subjectId: string | null;
  topicGroupId: string | null;
  beforePageId: string | null;
};

export type MoveTopicTarget = {
  targetSubjectId: string;
  beforeGroupId: string | null;
};

function pageScopeFor(
  userId: string,
  subjectId: string | null,
  topicGroupId: string | null
): PageSlugScope {
  if (topicGroupId) return { kind: "topic", userTopicGroupId: topicGroupId };
  if (subjectId) return { kind: "notebook", userSubjectId: subjectId };
  return { kind: "root", userId };
}

function legacyFileParentIds(
  chain: { id: string; parentId: string | null }[]
): { userSubjectId: string | null; userTopicGroupId: string | null } {
  if (chain.length === 0) {
    return { userSubjectId: null, userTopicGroupId: null };
  }
  const rootId = chain[0].id;
  if (chain.length === 1) {
    return { userSubjectId: rootId, userTopicGroupId: null };
  }
  return {
    userSubjectId: rootId,
    userTopicGroupId: chain[chain.length - 1].id,
  };
}

async function resolveTargetFolder(
  userId: string,
  subjectId: string | null,
  topicGroupId: string | null
) {
  if (topicGroupId) {
    const chain = await folderAncestors(topicGroupId);
    if (chain.length < 2) return null;
    const root = chain[0];
    const nested = chain[chain.length - 1];
    const owned = await prisma.userFolder.findFirst({
      where: { id: root.id, userId, parentId: null },
    });
    if (!owned || (subjectId && subjectId !== root.id)) return null;
    return { folderId: nested.id, ...legacyFileParentIds(chain) };
  }
  if (subjectId) {
    const root = await prisma.userFolder.findFirst({
      where: { id: subjectId, userId, parentId: null },
    });
    if (!root) return null;
    return {
      folderId: root.id,
      userSubjectId: root.id,
      userTopicGroupId: null,
    };
  }
  return {
    folderId: null,
    userSubjectId: null,
    userTopicGroupId: null,
  };
}

async function listPageIdsInScope(scope: PageSlugScope): Promise<string[]> {
  const rows = await prisma.userTopic.findMany({
    where: pageOrderWhere(scope),
    orderBy: { order: "asc" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function persistPageOrders(ids: string[]) {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.userTopic.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );
}

async function persistFolderOrders(parentId: string, ids: string[]) {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.userFolder.update({
        where: { id },
        data: { order: index + 1 },
      })
    )
  );
}

async function resolvePageSlug(
  scope: PageSlugScope,
  currentSlug: string,
  title: string
): Promise<string> {
  const existing = await findPageBySlug(scope, currentSlug);
  if (!existing) return currentSlug;
  return uniquePageSlug(scope, title);
}

export async function moveLibraryPage(
  userId: string,
  pageId: string,
  target: MovePageTarget
) {
  const page = await prisma.userTopic.findFirst({
    where: { id: pageId, userId },
  });
  if (!page) throw new Error("Page not found");

  const { subjectId, topicGroupId, beforePageId } = target;
  const dest = await resolveTargetFolder(userId, subjectId, topicGroupId);
  if (!dest) {
    if (topicGroupId) throw new Error("Topic not found");
    if (subjectId) throw new Error("Collection not found");
  }

  const destScope = pageScopeFor(
    userId,
    dest?.userSubjectId ?? null,
    dest?.userTopicGroupId ?? null
  );
  const slug = await resolvePageSlug(destScope, page.slug, page.title);

  const sourceScope = pageScopeFor(
    userId,
    page.userSubjectId,
    page.userTopicGroupId
  );

  const destIds = (await listPageIdsInScope(destScope)).filter(
    (id) => id !== pageId
  );
  const orderedDest = reorderBefore(destIds, pageId, beforePageId);

  const updated = await prisma.userTopic.update({
    where: { id: pageId },
    data: {
      folderId: dest?.folderId ?? null,
      userSubjectId: dest?.userSubjectId ?? null,
      userTopicGroupId: dest?.userTopicGroupId ?? null,
      slug,
      order: orderedDest.indexOf(pageId) + 1,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      order: true,
      completed: true,
      starred: true,
      contentType: true,
    },
  });

  await persistPageOrders(orderedDest);

  const sameContainer =
    page.folderId === (dest?.folderId ?? null) &&
    page.userSubjectId === (dest?.userSubjectId ?? null) &&
    page.userTopicGroupId === (dest?.userTopicGroupId ?? null);
  if (!sameContainer) {
    const sourceIds = (await listPageIdsInScope(sourceScope)).filter(
      (id) => id !== pageId
    );
    if (sourceIds.length > 0) await persistPageOrders(sourceIds);
  }

  return {
    page: updated,
    subjectId: dest?.userSubjectId ?? null,
    topicGroupId: dest?.userTopicGroupId ?? null,
    slug,
  };
}

export async function moveLibraryTopicGroup(
  userId: string,
  _sourceSubjectId: string,
  groupId: string,
  target: MoveTopicTarget
) {
  const group = await prisma.userFolder.findFirst({
    where: { id: groupId, userId },
  });
  if (!group || !group.parentId) throw new Error("Topic not found");

  const targetRoot = await prisma.userFolder.findFirst({
    where: { id: target.targetSubjectId, userId, parentId: null },
  });
  if (!targetRoot) throw new Error("Target collection not found");

  const slug =
    group.parentId === targetRoot.id
      ? group.slug
      : await uniqueFolderSlug(userId, targetRoot.id, group.name);

  const destSiblings = await prisma.userFolder.findMany({
    where: { parentId: targetRoot.id },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const destIds = destSiblings.map((g) => g.id).filter((id) => id !== groupId);
  const orderedDest = reorderBefore(destIds, groupId, target.beforeGroupId);

  await prisma.userFolder.update({
    where: { id: groupId },
    data: {
      parentId: targetRoot.id,
      slug,
      order: orderedDest.indexOf(groupId) + 1,
    },
  });

  await persistFolderOrders(targetRoot.id, orderedDest);

  if (group.parentId !== targetRoot.id) {
    const sourceSiblings = await prisma.userFolder.findMany({
      where: { parentId: group.parentId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const sourceIds = sourceSiblings
      .map((g) => g.id)
      .filter((id) => id !== groupId);
    if (sourceIds.length > 0 && group.parentId) {
      await persistFolderOrders(group.parentId, sourceIds);
    }

    await prisma.userTopic.updateMany({
      where: { folderId: groupId },
      data: { userSubjectId: targetRoot.id },
    });
  }

  const files = await prisma.userTopic.findMany({
    where: { folderId: groupId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      order: true,
      completed: true,
      starred: true,
      contentType: true,
    },
  });

  return {
    topicGroup: {
      id: group.id,
      title: group.name,
      slug,
      order: orderedDest.indexOf(groupId) + 1,
      pages: files,
    },
    sourceSubjectId: group.parentId,
    targetSubjectId: target.targetSubjectId,
  };
}

export async function defaultPageOrderInScope(scope: PageSlugScope) {
  return nextPageOrder(scope);
}
