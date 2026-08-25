import { Router, Request, Response } from "express";
import multer from "multer";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import {
  QuotaError,
  assertRelevancyDocRoom,
  relevancyDocLimit,
} from "../utils/quotas.js";
import {
  extractRelevancyText,
  normalizePastedBody,
  titleFromFilename,
} from "../utils/relevancyExtract.js";

const router = Router();
router.use(authMiddleware);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const docListSelect = {
  id: true,
  title: true,
  source: true,
  originalFilename: true,
  createdAt: true,
  updatedAt: true,
} as const;

router.get("/relevancy-docs", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const docs = await prisma.studyRelevancyDoc.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: docListSelect,
  });

  res.json({
    docs,
    used: docs.length,
    limit: relevancyDocLimit(user),
  });
});

router.post("/relevancy-docs", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as { title?: string; body?: string };
  const title = String(body.title ?? "").trim().slice(0, 120);
  let text: string;
  try {
    text = normalizePastedBody(String(body.body ?? ""));
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Body is empty",
    });
    return;
  }
  if (!title) {
    res.status(400).json({ error: "title required" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const used = await prisma.studyRelevancyDoc.count({ where: { userId } });
    assertRelevancyDocRoom(user, used);

    const doc = await prisma.studyRelevancyDoc.create({
      data: {
        userId,
        title,
        body: text,
        source: "PASTE",
      },
      select: { ...docListSelect, body: true },
    });
    res.status(201).json({ doc });
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post(
  "/relevancy-docs/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const file = req.file;
    if (!file?.buffer?.length) {
      res.status(400).json({ error: "file required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, role: true, subscriptionExpiresAt: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    try {
      const used = await prisma.studyRelevancyDoc.count({ where: { userId } });
      assertRelevancyDocRoom(user, used);

      const text = await extractRelevancyText(
        file.buffer,
        file.originalname || "upload",
        file.mimetype || ""
      );
      const titleFromBody = String(
        (req.body as { title?: string }).title ?? ""
      ).trim();
      const title = (
        titleFromBody || titleFromFilename(file.originalname || "Syllabus")
      ).slice(0, 120);

      const doc = await prisma.studyRelevancyDoc.create({
        data: {
          userId,
          title,
          body: text,
          source: "UPLOAD",
          originalFilename: file.originalname?.slice(0, 200) || null,
        },
        select: { ...docListSelect, body: true },
      });
      res.status(201).json({ doc });
    } catch (err) {
      if (err instanceof QuotaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      res.status(400).json({
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }
);

router.get("/relevancy-docs/:id", async (req: Request, res: Response) => {
  const doc = await prisma.studyRelevancyDoc.findFirst({
    where: { id: param(req, "id"), userId: req.user!.userId },
  });
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ doc });
});

router.patch("/relevancy-docs/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const existing = await prisma.studyRelevancyDoc.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const body = req.body as { title?: string; body?: string };
  const data: { title?: string; body?: string } = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim().slice(0, 120);
    if (!title) {
      res.status(400).json({ error: "title required" });
      return;
    }
    data.title = title;
  }
  if (body.body !== undefined) {
    try {
      data.body = normalizePastedBody(String(body.body));
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Body is empty",
      });
      return;
    }
  }

  const doc = await prisma.studyRelevancyDoc.update({
    where: { id: existing.id },
    data,
    select: { ...docListSelect, body: true },
  });
  res.json({ doc });
});

router.delete("/relevancy-docs/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const existing = await prisma.studyRelevancyDoc.findFirst({
    where: { id: param(req, "id"), userId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.chatThread.updateMany({
    where: { userId, relevancyDocId: existing.id },
    data: { relevancyDocId: null },
  });
  await prisma.studyRelevancyDoc.delete({ where: { id: existing.id } });
  res.json({ success: true });
});

export default router;
