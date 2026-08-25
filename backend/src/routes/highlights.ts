import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";

const router = Router();

router.get(
  "/:articleId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const highlights = await prisma.highlight.findMany({
      where: {
        userId: req.user!.userId,
        articleId: param(req, "articleId"),
      },
      orderBy: { startOffset: "asc" },
    });
    res.json({ highlights });
  }
);

router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const { articleId, text, startOffset, endOffset, color, note } = req.body;

  if (
    !articleId ||
    !text ||
    startOffset === undefined ||
    endOffset === undefined
  ) {
    res
      .status(400)
      .json({ error: "articleId, text, startOffset, endOffset required" });
    return;
  }

  const highlight = await prisma.highlight.create({
    data: {
      userId: req.user!.userId,
      articleId,
      text,
      startOffset,
      endOffset,
      color: color ?? "yellow",
      note,
    },
  });

  res.status(201).json({ highlight });
});

router.patch("/:id", authMiddleware, async (req: Request, res: Response) => {
  const id = param(req, "id");
  const highlight = await prisma.highlight.findUnique({ where: { id } });
  if (!highlight || highlight.userId !== req.user!.userId) {
    res.status(404).json({ error: "Highlight not found" });
    return;
  }
  const note =
    req.body?.note === undefined
      ? undefined
      : req.body.note == null || String(req.body.note).trim() === ""
        ? null
        : String(req.body.note).slice(0, 8000);
  const updated = await prisma.highlight.update({
    where: { id },
    data: note === undefined ? {} : { note },
  });
  res.json({ highlight: updated });
});

router.delete(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    const highlight = await prisma.highlight.findUnique({
      where: { id },
    });

    if (!highlight || highlight.userId !== req.user!.userId) {
      res.status(404).json({ error: "Highlight not found" });
      return;
    }

    await prisma.highlight.delete({ where: { id } });
    res.json({ success: true });
  }
);

export default router;
