import prisma from "./prisma.js";
import {
  findPageBySlug,
  nextPageOrder,
  pageOrderWhere,
  scopeFromFolderId,
  uniquePageSlug,
  type PageSlugScope,
} from "./pageScope.js";
import { reorderBefore } from "./libraryReorder.js";
import { uniqueFolderSlug } from "./fileScope.js";
import { folderAncestors } from "./folderPath.js";
import { FolderDepthError, MAX_FOLDER_DEPTH } from "./folderDepth.js";

export type MovePageTarget = {
  subjectId: string | null;
  topicGroupId: string | null;
  beforePageId: string | null;
};

export type MoveTopicTarget = {
  targetSubjectId: string;
  /** Collection id or nested folder id. Defaults to the collection root. */
  targetParentId?: string | null;
  beforeGroupId: string | null;
};

async function resolveTargetFolder(
  userId: string,
  subjectId: string | null,
  topicGroupId: string | null
) {
  if (topicGroupId) {
    const folder = await prisma.userFolder.findFirst({
      where: { id: topicGroupId, userId },
      select: { id: true, parentId: true },
    });
    if (!folder?.parentId) return null;
    const chain = await folderAncestors(folder.id);
    const root = chain[0];
    if (!root) return null;
    const owned = await prisma.userFolder.findFirst({
      where: { id: root.id, userId, parentId: null },
    });
    if (!owned || (subjectId && subjectId !== root.id)) return null;
    return { folderId: topicGroupId };
  }
  if (subjectId) {
    const root = await prisma.userFolder.findFirst({
      where: { id: subjectId, userId, parentId: null },
    });
    if (!root) return null;
    return { folderId: root.id };
  }
  return { folderId: null };
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

  const destScope = await scopeFromFolderId(userId, dest?.folderId ?? null);
  const slug = await resolvePageSlug(destScope, page.slug, page.title);
  const sourceScope = await scopeFromFolderId(userId, page.folderId);

  const destIds = (await listPageIdsInScope(destScope)).filter(
    (id) => id !== pageId
  );
  const orderedDest = reorderBefore(destIds, pageId, beforePageId);

  const updated = await prisma.userTopic.update({
    where: { id: pageId },
    data: {
      folderId: dest?.folderId ?? null,
      userSubjectId: null,
      userTopicGroupId: null,
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

  if (page.folderId !== (dest?.folderId ?? null)) {
    const sourceIds = (await listPageIdsInScope(sourceScope)).filter(
      (id) => id !== pageId
    );
    if (sourceIds.length > 0) await persistPageOrders(sourceIds);
  }

  return {
    page: updated,
    subjectId:
      destScope.kind === "notebook"
        ? destScope.userSubjectId
        : destScope.kind === "topic"
          ? null
          : null,
    topicGroupId:
      destScope.kind === "topic" ? destScope.userTopicGroupId : null,
    slug,
  };
}

async function folderSubtreeHeight(folderId: string): Promise<number> {
  const children = await prisma.userFolder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });
  if (children.length === 0) return 1;
  const depths = await Promise.all(
    children.map((child) => folderSubtreeHeight(child.id))
  );
  return 1 + Math.max(...depths);
}

async function resolveTopicMoveParent(
  userId: string,
  groupId: string,
  target: MoveTopicTarget
) {
  const targetRoot = await prisma.userFolder.findFirst({
    where: { id: target.targetSubjectId, userId, parentId: null },
  });
  if (!targetRoot) throw new Error("Target collection not found");

  const requested =
    target.targetParentId && target.targetParentId !== targetRoot.id
      ? target.targetParentId
      : targetRoot.id;

  if (requested === groupId) {
    throw new Error("Cannot move a folder into itself");
  }

  if (requested !== targetRoot.id) {
    const parent = await prisma.userFolder.findFirst({
      where: { id: requested, userId },
    });
    if (!parent) throw new Error("Target folder not found");

    const chain = await folderAncestors(parent.id);
    if (chain[0]?.id !== targetRoot.id) {
      throw new Error("Target folder not found");
    }
    if (chain.some((folder) => folder.id === groupId)) {
      throw new Error("Cannot move a folder into its own subfolder");
    }

    const subtree = await folderSubtreeHeight(groupId);
    if (chain.length + subtree > MAX_FOLDER_DEPTH) {
      throw new FolderDepthError(
        `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels`
      );
    }
    return parent.id;
  }

  const subtree = await folderSubtreeHeight(groupId);
  if (1 + subtree > MAX_FOLDER_DEPTH) {
    throw new FolderDepthError(
      `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels`
    );
  }
  return targetRoot.id;
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

  const parentId = await resolveTopicMoveParent(userId, groupId, target);

  const slug =
    group.parentId === parentId
      ? group.slug
      : await uniqueFolderSlug(userId, parentId, group.name);

  const destSiblings = await prisma.userFolder.findMany({
    where: { parentId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const destIds = destSiblings.map((g) => g.id).filter((id) => id !== groupId);
  const orderedDest = reorderBefore(destIds, groupId, target.beforeGroupId);

  await prisma.userFolder.update({
    where: { id: groupId },
    data: {
      parentId,
      slug,
      order: orderedDest.indexOf(groupId) + 1,
    },
  });

  await persistFolderOrders(parentId, orderedDest);

  if (group.parentId !== parentId) {
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
