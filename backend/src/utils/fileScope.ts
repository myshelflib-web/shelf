import prisma from "./prisma.js";
import { slugify, isReservedSlug } from "./pageScope.js";

export type FileSlugScope =
  | { kind: "root"; userId: string }
  | { kind: "folder"; folderId: string };

export async function findFileBySlug(scope: FileSlugScope, slug: string) {
  if (scope.kind === "root") {
    return prisma.userTopic.findFirst({
      where: {
        userId: scope.userId,
        folderId: null,
        slug,
      },
    });
  }
  return prisma.userTopic.findFirst({
    where: { folderId: scope.folderId, slug },
  });
}

export async function uniqueFileSlug(scope: FileSlugScope, title: string) {
  const base = slugify(title) || "file";
  let slug = base;
  let n = 2;
  while (await findFileBySlug(scope, slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export function fileOrderWhere(scope: FileSlugScope) {
  if (scope.kind === "root") {
    return { userId: scope.userId, folderId: null };
  }
  return { folderId: scope.folderId };
}

export async function nextFileOrder(scope: FileSlugScope) {
  return (await prisma.userTopic.count({ where: fileOrderWhere(scope) })) + 1;
}

export async function uniqueFolderSlug(
  userId: string,
  parentId: string | null,
  name: string
) {
  const base = slugify(name) || "folder";
  if (isReservedSlug(base)) {
    throw new Error("reserved");
  }
  let slug = base;
  let n = 2;
  while (
    await prisma.userFolder.findFirst({
      where: { userId, parentId, slug },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
