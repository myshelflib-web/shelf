import prisma from "./prisma.js";

export type PageSlugScope =
  | { kind: "root"; userId: string }
  | { kind: "notebook"; userSubjectId: string }
  | { kind: "topic"; userTopicGroupId: string };

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Reserved so `/my-content/file/...` and `/my-content/shared/...` never collide. */
export const RESERVED_SLUGS = new Set(["file", "shared"]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export async function findPageBySlug(scope: PageSlugScope, slug: string) {
  if (scope.kind === "root") {
    return prisma.userTopic.findFirst({
      where: {
        userId: scope.userId,
        folderId: null,
        slug,
      },
    });
  }
  if (scope.kind === "notebook") {
    return prisma.userTopic.findFirst({
      where: {
        folderId: scope.userSubjectId,
        slug,
      },
    });
  }
  return prisma.userTopic.findFirst({
    where: { folderId: scope.userTopicGroupId, slug },
  });
}

export async function uniquePageSlug(scope: PageSlugScope, title: string) {
  const base = slugify(title) || "page";
  let slug = base;
  let n = 2;
  while (await findPageBySlug(scope, slug)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export function pageOrderWhere(scope: PageSlugScope) {
  if (scope.kind === "root") {
    return {
      userId: scope.userId,
      folderId: null,
    };
  }
  if (scope.kind === "notebook") {
    return {
      folderId: scope.userSubjectId,
    };
  }
  return { folderId: scope.userTopicGroupId };
}

export async function nextPageOrder(scope: PageSlugScope) {
  return (await prisma.userTopic.count({ where: pageOrderWhere(scope) })) + 1;
}

/** Map a stored folderId to the slug scope used for file order/uniqueness. */
export async function scopeFromFolderId(
  userId: string,
  folderId: string | null
): Promise<PageSlugScope> {
  if (!folderId) return { kind: "root", userId };
  const folder = await prisma.userFolder.findFirst({
    where: { id: folderId, userId },
    select: { id: true, parentId: true },
  });
  if (!folder) return { kind: "root", userId };
  if (!folder.parentId) {
    return { kind: "notebook", userSubjectId: folder.id };
  }
  return { kind: "topic", userTopicGroupId: folder.id };
}
