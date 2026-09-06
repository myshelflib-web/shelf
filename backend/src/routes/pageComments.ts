import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import {
  canAnnotate,
  findAccessiblePage,
} from "../utils/pageAccess.js";

const router = Router();
router.use(authMiddleware);

router.get("/pages/:id/comments", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageId = param(req, "id");
  const access = await findAccessiblePage(userId, pageId);
  if (!access) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const comments = await prisma.pageComment.findMany({
    where: { pageId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
  });
  res.json({ comments, canWrite: canAnnotate(access.role) });
});

router.post("/pages/:id/comments", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageId = param(req, "id");
  const access = await findAccessiblePage(userId, pageId);
  if (!access || !canAnnotate(access.role)) {
    res.status(403).json({ error: "Editors only" });
    return;
  }
  const body = req.body as {
    body?: string;
    parentId?: string;
    anchorQuote?: string;
    anchorJson?: unknown;
  };
  const text = String(body.body ?? "").trim();
  if (!text) {
    res.status(400).json({ error: "body required" });
    return;
  }
  const comment = await prisma.pageComment.create({
    data: {
      pageId,
      userId,
      body: text.slice(0, 8_000),
      parentId: body.parentId ? String(body.parentId) : null,
      anchorQuote: body.anchorQuote
        ? String(body.anchorQuote).slice(0, 2_000)
        : null,
      anchorJson: body.anchorJson ? (body.anchorJson as object) : undefined,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  res.status(201).json({ comment });
});

router.patch(
  "/pages/:id/comments/:commentId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const pageId = param(req, "id");
    const commentId = param(req, "commentId");
    const access = await findAccessiblePage(userId, pageId);
    if (!access || !canAnnotate(access.role)) {
      res.status(403).json({ error: "Editors only" });
      return;
    }
    const existing = await prisma.pageComment.findFirst({
      where: { id: commentId, pageId },
    });
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const body = req.body as { body?: string; resolved?: boolean };
    const comment = await prisma.pageComment.update({
      where: { id: commentId },
      data: {
        ...(body.body != null
          ? { body: String(body.body).trim().slice(0, 8_000) }
          : {}),
        ...(body.resolved === true
          ? { resolvedAt: new Date() }
          : body.resolved === false
            ? { resolvedAt: null }
            : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    res.json({ comment });
  }
);

router.delete(
  "/pages/:id/comments/:commentId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const pageId = param(req, "id");
    const commentId = param(req, "commentId");
    const access = await findAccessiblePage(userId, pageId);
    const existing = await prisma.pageComment.findFirst({
      where: { id: commentId, pageId },
    });
    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (
      existing.userId !== userId &&
      (!access || !canAnnotate(access.role))
    ) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await prisma.pageComment.delete({ where: { id: commentId } });
    res.json({ success: true });
  }
);

export default router;
