import type { PageShareRole, UserTopic } from "@prisma/client";
import prisma from "./prisma.js";

export type PageAccessRole = "OWNER" | PageShareRole | "LINK_VIEWER";

export type AccessiblePage = {
  page: UserTopic & {
    userSubject: { id: string; name: string; slug: string } | null;
    userTopicGroup: { id: string; title: string; slug: string } | null;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  };
  role: PageAccessRole;
  shareId?: string;
};

const pageInclude = {
  userSubject: { select: { id: true, name: true, slug: true } },
  userTopicGroup: { select: { id: true, title: true, slug: true } },
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
} as const;

export async function findOwnedPage(userId: string, pageId: string) {
  return prisma.userTopic.findFirst({
    where: { id: pageId, userId },
    include: pageInclude,
  });
}

/**
 * Owner, active named share, or signed-in user with a valid link-share token.
 * Source mutations (delete, replace, rename) must use findOwnedPage.
 */
export async function findAccessiblePage(
  userId: string,
  pageId: string,
  opts?: { linkToken?: string | null }
): Promise<AccessiblePage | null> {
  const owned = await findOwnedPage(userId, pageId);
  if (owned) {
    return { page: owned, role: "OWNER" };
  }

  const page = await prisma.userTopic.findFirst({
    where: { id: pageId },
    include: pageInclude,
  });
  if (!page) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return null;

  const share = await prisma.pageShare.findFirst({
    where: {
      pageId,
      status: { in: ["ACTIVE", "PENDING"] },
      OR: [{ granteeId: userId }, { granteeEmail: user.email }],
    },
  });

  if (share) {
    if (share.status === "PENDING" || share.granteeId !== userId) {
      await prisma.pageShare.update({
        where: { id: share.id },
        data: {
          status: "ACTIVE",
          granteeId: userId,
          hiddenAt: null,
        },
      });
    }
    return { page, role: share.role, shareId: share.id };
  }

  const token = opts?.linkToken?.trim();
  if (
    page.linkShareEnabled &&
    page.linkShareToken &&
    token &&
    token === page.linkShareToken
  ) {
    return { page, role: "LINK_VIEWER" };
  }

  return null;
}

export function canAnnotate(role: PageAccessRole): boolean {
  return role === "OWNER" || role === "EDITOR";
}
