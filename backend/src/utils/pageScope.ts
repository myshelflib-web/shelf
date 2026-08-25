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

/** Reserved so `/my-content/file/...` never collides with a notebook/topic named "file". */
export const RESERVED_SLUGS = new Set(["file"]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

export async function findPageBySlug(scope: PageSlugScope, slug: string) {
  if (scope.kind === "root") {
    return prisma.userTopic.findFirst({
      where: {
        userId: scope.userId,
        userSubjectId: null,
        userTopicGroupId: null,
        slug,
      },
    });
  }
  if (scope.kind === "notebook") {
    return prisma.userTopic.findFirst({
      where: {
        userSubjectId: scope.userSubjectId,
        userTopicGroupId: null,
        slug,
      },
    });
  }
  return prisma.userTopic.findFirst({
    where: { userTopicGroupId: scope.userTopicGroupId, slug },
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
      userSubjectId: null,
      userTopicGroupId: null,
    };
  }
  if (scope.kind === "notebook") {
    return {
      userSubjectId: scope.userSubjectId,
      userTopicGroupId: null,
    };
  }
  return { userTopicGroupId: scope.userTopicGroupId };
}

export async function nextPageOrder(scope: PageSlugScope) {
  return (await prisma.userTopic.count({ where: pageOrderWhere(scope) })) + 1;
}
