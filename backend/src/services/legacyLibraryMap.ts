import prisma from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

export type LegacyLibraryMapResult = {
  foldersCreated: number;
  filesLinked: number;
};

function isBenignCreateError(err: unknown): boolean {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: string }).code)
      : "";
  // Unique / FK races — skip that row; do not fail the whole library list.
  return code === "P2002" || code === "P2003" || code === "P2025";
}

/**
 * Maps legacy UserSubject / UserTopicGroup → UserFolder and sets UserTopic.folderId
 * from userTopicGroupId / userSubjectId when still null.
 *
 * Idempotent. Safe to call on every library list — no-op when already mapped.
 * Same UUIDs as the SQL migration so existing links keep working.
 * Never throws for row-level conflicts (slug races); logs and continues.
 */
export async function ensureLegacyLibraryMapped(
  userId: string
): Promise<LegacyLibraryMapResult> {
  const result: LegacyLibraryMapResult = { foldersCreated: 0, filesLinked: 0 };

  try {
    const subjects = await prisma.userSubject.findMany({
      where: { userId },
    });
    if (subjects.length > 0) {
      const existing = await prisma.userFolder.findMany({
        where: { id: { in: subjects.map((s) => s.id) } },
        select: { id: true },
      });
      const have = new Set(existing.map((f) => f.id));
      for (const s of subjects) {
        if (have.has(s.id)) continue;
        try {
          await prisma.userFolder.create({
            data: {
              id: s.id,
              userId: s.userId,
              parentId: null,
              name: s.name,
              slug: s.slug,
              description: s.description,
              icon: s.icon,
              order: s.order,
              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
            },
          });
          result.foldersCreated += 1;
        } catch (err) {
          if (!isBenignCreateError(err)) throw err;
          logger.warn("library.legacy_map_subject_skip", {
            userId,
            subjectId: s.id,
            code:
              err && typeof err === "object" && "code" in err
                ? String((err as { code?: string }).code)
                : undefined,
          });
        }
      }
    }

    const groups = await prisma.userTopicGroup.findMany({
      where: { userSubject: { userId } },
    });
    if (groups.length > 0) {
      const existing = await prisma.userFolder.findMany({
        where: { id: { in: groups.map((g) => g.id) } },
        select: { id: true },
      });
      const have = new Set(existing.map((f) => f.id));
      for (const g of groups) {
        if (have.has(g.id)) continue;
        const parent = await prisma.userFolder.findFirst({
          where: { id: g.userSubjectId, userId },
          select: { id: true },
        });
        if (!parent) continue;
        try {
          await prisma.userFolder.create({
            data: {
              id: g.id,
              userId,
              parentId: g.userSubjectId,
              name: g.title,
              slug: g.slug,
              description: null,
              icon: "📁",
              order: g.order,
              createdAt: g.createdAt,
              updatedAt: g.updatedAt,
            },
          });
          result.foldersCreated += 1;
        } catch (err) {
          if (!isBenignCreateError(err)) throw err;
          logger.warn("library.legacy_map_topic_skip", {
            userId,
            groupId: g.id,
            code:
              err && typeof err === "object" && "code" in err
                ? String((err as { code?: string }).code)
                : undefined,
          });
        }
      }
    }

    const unmapped = await prisma.userTopic.findMany({
      where: {
        userId,
        folderId: null,
        OR: [
          { userTopicGroupId: { not: null } },
          { userSubjectId: { not: null } },
        ],
      },
      select: {
        id: true,
        userSubjectId: true,
        userTopicGroupId: true,
      },
    });

    for (const page of unmapped) {
      const folderId = page.userTopicGroupId ?? page.userSubjectId;
      if (!folderId) continue;
      const folder = await prisma.userFolder.findFirst({
        where: { id: folderId, userId },
        select: { id: true },
      });
      if (!folder) continue;
      try {
        await prisma.userTopic.update({
          where: { id: page.id },
          data: { folderId },
        });
        result.filesLinked += 1;
      } catch (err) {
        if (!isBenignCreateError(err)) throw err;
        logger.warn("library.legacy_map_file_skip", {
          userId,
          pageId: page.id,
        });
      }
    }
  } catch (err) {
    // Library list must stay up even if mapping hits an unexpected error.
    logger.error("library.legacy_map_failed", {
      userId,
      err:
        err instanceof Error
          ? { message: err.message, name: err.name }
          : { message: String(err) },
    });
  }

  return result;
}
