import prisma from "./prisma.js";
import {
  findPageBySlug,
  nextPageOrder,
  pageOrderWhere,
  type PageSlugScope,
  uniquePageSlug,
} from "./pageScope.js";
import { reorderBefore } from "./libraryReorder.js";

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

async function persistTopicGroupOrders(subjectId: string, ids: string[]) {
  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.userTopicGroup.update({
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

async function resolveTopicSlug(
  subjectId: string,
  currentSlug: string,
  title: string
): Promise<string> {
  const existing = await prisma.userTopicGroup.findFirst({
    where: { userSubjectId: subjectId, slug: currentSlug },
  });
  if (!existing) return currentSlug;
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "topic";
  let slug = base;
  let n = 2;
  while (
    await prisma.userTopicGroup.findFirst({
      where: { userSubjectId: subjectId, slug },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
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

  if (topicGroupId) {
    if (!subjectId) throw new Error("Collection required for topic pages");
    const group = await prisma.userTopicGroup.findFirst({
      where: { id: topicGroupId, userSubjectId: subjectId },
      include: { userSubject: { select: { userId: true } } },
    });
    if (!group || group.userSubject.userId !== userId) {
      throw new Error("Topic not found");
    }
  } else if (subjectId) {
    const subject = await prisma.userSubject.findFirst({
      where: { id: subjectId, userId },
    });
    if (!subject) throw new Error("Collection not found");
  }

  const destScope = pageScopeFor(userId, subjectId, topicGroupId);
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
      userSubjectId: subjectId,
      userTopicGroupId: topicGroupId,
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
    page.userSubjectId === subjectId &&
    page.userTopicGroupId === topicGroupId;
  if (!sameContainer) {
    const sourceIds = (await listPageIdsInScope(sourceScope)).filter(
      (id) => id !== pageId
    );
    if (sourceIds.length > 0) await persistPageOrders(sourceIds);
  }

  return {
    page: updated,
    subjectId,
    topicGroupId,
    slug,
  };
}

export async function moveLibraryTopicGroup(
  userId: string,
  sourceSubjectId: string,
  groupId: string,
  target: MoveTopicTarget
) {
  const source = await prisma.userSubject.findFirst({
    where: { id: sourceSubjectId, userId },
  });
  if (!source) throw new Error("Collection not found");

  const group = await prisma.userTopicGroup.findFirst({
    where: { id: groupId, userSubjectId: sourceSubjectId },
  });
  if (!group) throw new Error("Topic not found");

  const targetSubject = await prisma.userSubject.findFirst({
    where: { id: target.targetSubjectId, userId },
  });
  if (!targetSubject) throw new Error("Target collection not found");

  const slug =
    target.targetSubjectId === sourceSubjectId
      ? group.slug
      : await resolveTopicSlug(target.targetSubjectId, group.slug, group.title);

  const destGroups = await prisma.userTopicGroup.findMany({
    where: { userSubjectId: target.targetSubjectId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  const destIds = destGroups.map((g) => g.id).filter((id) => id !== groupId);
  const orderedDest = reorderBefore(
    destIds,
    groupId,
    target.beforeGroupId
  );

  await prisma.$transaction([
    prisma.userTopicGroup.update({
      where: { id: groupId },
      data: {
        userSubjectId: target.targetSubjectId,
        slug,
        order: orderedDest.indexOf(groupId) + 1,
      },
    }),
    ...(target.targetSubjectId !== sourceSubjectId
      ? [
          prisma.userTopic.updateMany({
            where: { userTopicGroupId: groupId },
            data: { userSubjectId: target.targetSubjectId },
          }),
        ]
      : []),
  ]);

  await persistTopicGroupOrders(target.targetSubjectId, orderedDest);

  if (target.targetSubjectId !== sourceSubjectId) {
    const sourceGroups = await prisma.userTopicGroup.findMany({
      where: { userSubjectId: sourceSubjectId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const sourceIds = sourceGroups
      .map((g) => g.id)
      .filter((id) => id !== groupId);
    if (sourceIds.length > 0) {
      await persistTopicGroupOrders(sourceSubjectId, sourceIds);
    }
  }

  const updated = await prisma.userTopicGroup.findUniqueOrThrow({
    where: { id: groupId },
    include: {
      pages: {
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
      },
    },
  });

  return {
    topicGroup: updated,
    sourceSubjectId,
    targetSubjectId: target.targetSubjectId,
  };
}

export async function defaultPageOrderInScope(scope: PageSlugScope) {
  return nextPageOrder(scope);
}
