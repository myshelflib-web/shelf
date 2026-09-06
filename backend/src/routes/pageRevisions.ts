import { createHash } from "crypto";
import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";

const router = Router();
router.use(authMiddleware);

const MAX_REVISIONS = 30;

async function assertPageOwner(userId: string, pageId: string) {
  return prisma.userTopic.findFirst({
    where: { id: pageId, userId },
    select: { id: true },
  });
}

router.get("/pages/:id/revisions", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageId = param(req, "id");
  if (!(await assertPageOwner(userId, pageId))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const revisions = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    take: MAX_REVISIONS,
    select: { id: true, label: true, createdAt: true },
  });
  res.json({ revisions });
});

router.get(
  "/pages/:id/revisions/:revisionId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const pageId = param(req, "id");
    const revisionId = param(req, "revisionId");
    if (!(await assertPageOwner(userId, pageId))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const revision = await prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId },
    });
    if (!revision) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ revision });
  }
);

router.post("/pages/:id/revisions", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageId = param(req, "id");
  if (!(await assertPageOwner(userId, pageId))) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const html = String((req.body as { html?: string }).html ?? "");
  const label = (req.body as { label?: string }).label
    ? String((req.body as { label?: string }).label).trim().slice(0, 120)
    : null;
  if (!html.trim()) {
    res.status(400).json({ error: "html required" });
    return;
  }
  const hash = createHash("sha256").update(html).digest("hex");
  const latest = await prisma.pageRevision.findFirst({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    select: { html: true },
  });
  if (latest) {
    const prevHash = createHash("sha256").update(latest.html).digest("hex");
    if (prevHash === hash) {
      res.json({ skipped: true, reason: "unchanged" });
      return;
    }
  }
  const revision = await prisma.pageRevision.create({
    data: { pageId, userId, html, label },
    select: { id: true, label: true, createdAt: true },
  });
  const extras = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { createdAt: "desc" },
    skip: MAX_REVISIONS,
    select: { id: true },
  });
  if (extras.length) {
    await prisma.pageRevision.deleteMany({
      where: { id: { in: extras.map((e) => e.id) } },
    });
  }
  res.status(201).json({ revision });
});

router.post(
  "/pages/:id/revisions/:revisionId/restore",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const pageId = param(req, "id");
    const revisionId = param(req, "revisionId");
    if (!(await assertPageOwner(userId, pageId))) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const target = await prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId },
    });
    if (!target) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const currentHtml = String(
      (req.body as { currentHtml?: string }).currentHtml ?? ""
    );
    if (currentHtml.trim()) {
      await prisma.pageRevision.create({
        data: {
          pageId,
          userId,
          html: currentHtml,
          label: "Before restore",
        },
      });
    }
    res.json({ html: target.html, revisionId: target.id });
  }
);

export default router;
