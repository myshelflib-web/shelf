import prisma from "../utils/prisma.js";
import {
  buildLegacySubjectTree,
  fileSelect,
  orderSubjectsByIds,
  type LegacySubject,
} from "./legacyLibraryTree.js";
import { ensureLegacyLibraryMapped } from "./legacyLibraryMap.js";
import { foldersForLegacySubjectIds } from "./legacyLibraryMapHelpers.js";
import { uniqueFolderSlug } from "../utils/fileScope.js";
import { assertCanNestUnder } from "../utils/folderPath.js";

import type { SlimNotebook } from "../utils/notebookBrowse.js";

export async function slimRootFolders(userId: string): Promise<SlimNotebook[]> {
  await ensureLegacyLibraryMapped(userId);

  const roots = await prisma.userFolder.findMany({
    where: { userId, parentId: null },
    select: {
      id: true,
      name: true,
      description: true,
      order: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { order: "asc" },
  });

  if (roots.length === 0) return [];

  const folders = await prisma.userFolder.findMany({
    where: { userId },
    select: { id: true, parentId: true },
  });
  const files = await prisma.userTopic.findMany({
    where: { userId, folderId: { not: null } },
    select: {
      folderId: true,
      title: true,
      contentType: true,
      starred: true,
      viewedAt: true,
      updatedAt: true,
    },
  });

  const childrenByParent = new Map<string, string[]>();
  for (const f of folders) {
    if (!f.parentId) continue;
    const list = childrenByParent.get(f.parentId) ?? [];
    list.push(f.id);
    childrenByParent.set(f.parentId, list);
  }

  function collectFolderIds(rootId: string): Set<string> {
    const out = new Set<string>([rootId]);
    const stack = [rootId];
    while (stack.length) {
      const id = stack.pop()!;
      for (const child of childrenByParent.get(id) ?? []) {
        if (!out.has(child)) {
          out.add(child);
          stack.push(child);
        }
      }
    }
    return out;
  }

  return roots.map((root) => {
    const folderIds = collectFolderIds(root.id);
    const pages = files.filter((f) => f.folderId && folderIds.has(f.folderId));
    let lastActivity = root.updatedAt.getTime();
    for (const page of pages) {
      const t = (page.viewedAt ?? page.updatedAt)?.getTime() ?? 0;
      if (t > lastActivity) lastActivity = t;
    }
    return {
      id: root.id,
      name: root.name,
      description: root.description,
      order: root.order,
      createdAt: root.createdAt,
      // Browse "recent"/"oldest" use this — prefer last page activity over folder row edits.
      updatedAt: new Date(lastActivity),
      pageCount: pages.length,
      hasPdf: pages.some((p) => p.contentType === "PDF"),
      hasLink: pages.some((p) => p.contentType === "LINK"),
      hasStarred: pages.some((p) => p.starred),
      pageTitles: pages.map((p) => p.title),
    };
  });
}

export async function loadLegacySubjectsForUser(
  userId: string,
  ids?: string[]
): Promise<LegacySubject[]> {
  await ensureLegacyLibraryMapped(userId);

  const allFolders = await prisma.userFolder.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      order: true,
      parentId: true,
    },
    orderBy: { order: "asc" },
  });

  const scopedFolders = foldersForLegacySubjectIds(allFolders, ids);
  const allFolderIds = scopedFolders.map((f) => f.id);

  const files =
    allFolderIds.length === 0 && ids && ids.length > 0
      ? []
      : await prisma.userTopic.findMany({
          where: {
            userId,
            OR: [
              ...(ids && ids.length > 0 ? [] : [{ folderId: null }]),
              ...(allFolderIds.length > 0
                ? [{ folderId: { in: allFolderIds } }]
                : []),
            ],
          },
          select: { ...fileSelect, folderId: true },
          orderBy: { order: "asc" },
        });

  return orderSubjectsByIds(
    buildLegacySubjectTree(scopedFolders, files),
    ids
  );
}

export async function loadRootFiles(userId: string) {
  await ensureLegacyLibraryMapped(userId);
  return prisma.userTopic.findMany({
    where: { userId, folderId: null },
    select: fileSelect,
    orderBy: { order: "asc" },
  });
}

export async function createRootFolder(
  userId: string,
  input: { name: string; description?: string | null; icon?: string }
) {
  const slug = await uniqueFolderSlug(userId, null, input.name);
  const order =
    (await prisma.userFolder.count({ where: { userId, parentId: null } })) + 1;
  return prisma.userFolder.create({
    data: {
      userId,
      parentId: null,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
      icon: input.icon ?? "📁",
      order,
    },
  });
}

export async function createNestedFolder(
  userId: string,
  parentId: string,
  input: { name: string }
) {
  const parent = await prisma.userFolder.findFirst({
    where: { id: parentId, userId },
  });
  if (!parent) return null;

  await assertCanNestUnder(parentId);

  const slug = await uniqueFolderSlug(userId, parentId, input.name);
  const order =
    (await prisma.userFolder.count({ where: { parentId } })) + 1;

  return prisma.userFolder.create({
    data: {
      userId,
      parentId,
      name: input.name.trim(),
      slug,
      order,
    },
  });
}

export async function findFolderForUser(userId: string, folderId: string) {
  return prisma.userFolder.findFirst({
    where: { id: folderId, userId },
  });
}

export async function findFolderBySlug(
  userId: string,
  parentId: string | null,
  slug: string
) {
  return prisma.userFolder.findFirst({
    where: { userId, parentId, slug },
  });
}

/** Full folder tree for new clients (arbitrary depth). */
export async function loadFolderTree(userId: string) {
  await ensureLegacyLibraryMapped(userId);

  const folders = await prisma.userFolder.findMany({
    where: { userId },
    select: {
      id: true,
      parentId: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      order: true,
    },
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  const files = await prisma.userTopic.findMany({
    where: { userId },
    select: { ...fileSelect, folderId: true },
    orderBy: { order: "asc" },
  });

  const rootFiles = files.filter((f) => !f.folderId);
  return { folders, files, rootFiles };
}
