import { randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import type { PageShareRole } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.js";
import { normalizeEmail } from "../services/email/index.js";
import { getFromS3 } from "../services/s3.js";
import { param } from "../utils/param.js";
import prisma from "../utils/prisma.js";
import {
  canAnnotate,
  findAccessiblePage,
  findOwnedPage,
  type PageAccessRole,
} from "../utils/pageAccess.js";

const router = Router();
router.use(authMiddleware);

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function roleFromBody(raw: unknown): PageShareRole {
  return String(raw).toLowerCase() === "edit" ||
    String(raw).toUpperCase() === "EDITOR"
    ? "EDITOR"
    : "VIEWER";
}

function serializeShare(s: {
  id: string;
  granteeEmail: string;
  role: PageShareRole;
  status: string;
  grantee?: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}) {
  return {
    id: s.id,
    email: s.granteeEmail,
    role: s.role === "EDITOR" ? "edit" : "view",
    status: s.status.toLowerCase(),
    pending: s.status === "PENDING",
    user: s.grantee
      ? {
          id: s.grantee.id,
          name: s.grantee.name,
          email: s.grantee.email,
          avatarUrl: s.grantee.avatarUrl,
        }
      : null,
  };
}

function accessPayload(
  role: PageAccessRole,
  page: {
    linkShareEnabled: boolean;
    linkShareToken: string | null;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  },
  viewerId: string
) {
  const isOwner = role === "OWNER";
  return {
    role: role === "EDITOR" ? "edit" : role === "OWNER" ? "owner" : "view",
    canEdit: role === "OWNER" || role === "EDITOR",
    canAnnotate: canAnnotate(role),
    canManageShares: isOwner,
    isOwner,
    owner: {
      id: page.user.id,
      name: page.user.name,
      email: page.user.email,
      avatarUrl: page.user.avatarUrl,
    },
    linkShareEnabled: page.linkShareEnabled,
    linkToken: isOwner ? page.linkShareToken : null,
    viewerId,
  };
}

async function serializePageDetail(
  access: NonNullable<Awaited<ReturnType<typeof findAccessiblePage>>>,
  viewerId: string
) {
  const { page, role } = access;
  const isPdf = page.contentType === "PDF";
  const isLink = page.contentType === "LINK";
  let content: string | null = null;
  if (!isPdf && !isLink && page.contentUrl) {
    try {
      content = await getFromS3(page.contentUrl);
    } catch {
      content = null;
    }
  }
  const hasView =
    page.viewedAt != null ||
    page.viewPdfPage != null ||
    page.viewScrollTop != null;

  return {
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      content,
      status: page.status,
      contentType: page.contentType,
      sourceUrl: page.sourceUrl ?? null,
      hasPdf: Boolean(page.pdfKey),
      completed: page.completed,
      readPercent: page.readPercent,
      starred: page.starred,
      notebook: page.userSubject,
      topic: page.userTopicGroup,
      isPersonal: true,
      shared: role !== "OWNER",
      view: hasView
        ? {
            pdfPage: page.viewPdfPage,
            pageOffset: page.viewPageOffset,
            scrollTop: page.viewScrollTop,
            scale: page.viewScale,
            viewedAt: page.viewedAt?.toISOString() ?? null,
          }
        : null,
    },
    navigation: { prev: null, next: null },
    context: {
      notebookSlug: page.userSubject?.slug ?? null,
      topicSlug: page.userTopicGroup?.slug ?? null,
      shared: role !== "OWNER",
    },
    access: accessPayload(role, page, viewerId),
  };
}

router.get("/pages/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const access = await findAccessiblePage(userId, param(req, "id"), {
    linkToken: typeof req.query.t === "string" ? req.query.t : null,
  });
  if (!access) {
    res
      .status(403)
      .json({ error: "You no longer have access", code: "ACCESS_DENIED" });
    return;
  }
  if (access.shareId) {
    await prisma.pageShare.updateMany({
      where: { id: access.shareId, seenAt: null },
      data: { seenAt: new Date() },
    });
  }
  res.json(await serializePageDetail(access, userId));
});

router.get("/pages/:id/shares", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = await findOwnedPage(userId, param(req, "id"));
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  const shares = await prisma.pageShare.findMany({
    where: { pageId: page.id, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      grantee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json({
    owner: {
      id: page.user.id,
      name: page.user.name,
      email: page.user.email,
      avatarUrl: page.user.avatarUrl,
    },
    shares: shares.map(serializeShare),
    generalAccess: page.linkShareEnabled ? "link" : "restricted",
    linkToken: page.linkShareToken,
    linkPath: page.linkShareToken
      ? `/my-content/shared/${page.id}?t=${page.linkShareToken}`
      : null,
  });
});

router.put("/pages/:id/shares", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = await findOwnedPage(userId, param(req, "id"));
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const peopleRaw = Array.isArray(req.body?.people) ? req.body.people : [];
  const generalAccess =
    String(req.body?.generalAccess ?? "restricted") === "link"
      ? "link"
      : "restricted";

  const desired = new Map<string, { email: string; role: PageShareRole }>();
  for (const row of peopleRaw) {
    const email = normalizeEmail(String(row?.email ?? ""));
    if (!email || !isEmail(email) || email === page.user.email) continue;
    desired.set(email, { email, role: roleFromBody(row?.role) });
  }

  const existing = await prisma.pageShare.findMany({
    where: { pageId: page.id },
  });

  for (const share of existing) {
    const next = desired.get(share.granteeEmail);
    if (!next) {
      if (share.status !== "REVOKED") {
        await prisma.pageShare.update({
          where: { id: share.id },
          data: { status: "REVOKED" },
        });
      }
      continue;
    }
    const user = await prisma.user.findUnique({
      where: { email: next.email },
      select: { id: true },
    });
    await prisma.pageShare.update({
      where: { id: share.id },
      data: {
        role: next.role,
        status: user ? "ACTIVE" : "PENDING",
        granteeId: user?.id ?? share.granteeId,
        hiddenAt: null,
      },
    });
    desired.delete(share.granteeEmail);
  }

  for (const next of desired.values()) {
    const user = await prisma.user.findUnique({
      where: { email: next.email },
      select: { id: true },
    });
    await prisma.pageShare.create({
      data: {
        pageId: page.id,
        ownerId: userId,
        granteeEmail: next.email,
        granteeId: user?.id ?? null,
        role: next.role,
        status: user ? "ACTIVE" : "PENDING",
      },
    });
  }

  let linkShareToken = page.linkShareToken;
  if (generalAccess === "link") {
    if (!linkShareToken) {
      linkShareToken = randomBytes(12).toString("base64url");
    }
    await prisma.userTopic.update({
      where: { id: page.id },
      data: { linkShareEnabled: true, linkShareToken },
    });
  } else {
    await prisma.userTopic.update({
      where: { id: page.id },
      data: { linkShareEnabled: false },
    });
  }

  const shares = await prisma.pageShare.findMany({
    where: { pageId: page.id, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      grantee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json({
    owner: {
      id: page.user.id,
      name: page.user.name,
      email: page.user.email,
      avatarUrl: page.user.avatarUrl,
    },
    shares: shares.map(serializeShare),
    generalAccess,
    linkToken: generalAccess === "link" ? linkShareToken : null,
    linkPath:
      generalAccess === "link" && linkShareToken
        ? `/my-content/shared/${page.id}?t=${linkShareToken}`
        : null,
  });
});

router.delete(
  "/pages/:id/shares/:shareId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const page = await findOwnedPage(userId, param(req, "id"));
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    const share = await prisma.pageShare.findFirst({
      where: { id: param(req, "shareId"), pageId: page.id },
    });
    if (!share) {
      res.status(404).json({ error: "Share not found" });
      return;
    }
    await prisma.pageShare.update({
      where: { id: share.id },
      data: { status: "REVOKED" },
    });
    res.json({ ok: true });
  }
);

router.get("/shared-with-me", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await prisma.pageShare.updateMany({
    where: { granteeEmail: user.email, status: "PENDING" },
    data: { status: "ACTIVE", granteeId: userId },
  });

  const shares = await prisma.pageShare.findMany({
    where: {
      OR: [{ granteeId: userId }, { granteeEmail: user.email }],
      status: { in: ["ACTIVE", "REVOKED"] },
      hiddenAt: null,
    },
    include: {
      page: {
        select: {
          id: true,
          title: true,
          contentType: true,
        },
      },
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const unread = shares.filter(
    (s) => s.status === "ACTIVE" && !s.seenAt
  ).length;

  res.json({
    unread,
    items: shares.map((s) => ({
      shareId: s.id,
      pageId: s.page.id,
      title: s.page.title,
      contentType: s.page.contentType,
      role: s.role === "EDITOR" ? "edit" : "view",
      status: s.status === "REVOKED" ? "removed" : "active",
      href: `/my-content/shared/${s.page.id}`,
      owner: s.owner,
      unread: s.status === "ACTIVE" && !s.seenAt,
      copiedPageId: s.copiedPageId,
      updatedAt: s.updatedAt.toISOString(),
    })),
  });
});

router.post(
  "/shared-with-me/:shareId/hide",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const share = await prisma.pageShare.findFirst({
      where: {
        id: param(req, "shareId"),
        OR: [{ granteeId: userId }, { granteeEmail: user?.email ?? "" }],
      },
    });
    if (!share) {
      res.status(404).json({ error: "Share not found" });
      return;
    }
    await prisma.pageShare.update({
      where: { id: share.id },
      data: { hiddenAt: new Date() },
    });
    res.json({ ok: true });
  }
);

router.get("/users/lookup", async (req: Request, res: Response) => {
  const raw = String(req.query.q ?? "").trim();
  const q = normalizeEmail(raw);
  if (!raw || raw.length < 2) {
    res.json({ users: [] });
    return;
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { startsWith: q, mode: "insensitive" } },
        { name: { contains: raw, mode: "insensitive" } },
      ],
      NOT: { id: req.user!.userId },
    },
    select: { id: true, name: true, email: true, avatarUrl: true },
    take: 8,
  });
  res.json({ users: users.map((u) => ({ ...u, onShelf: true })) });
});

export default router;
