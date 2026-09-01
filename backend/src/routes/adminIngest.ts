import { Router, Request, Response } from "express";
import { IngestItemStatus } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { seedDefaultIngestSources } from "../services/ingest/seedSources.js";
import { enqueueSourcePoll } from "../services/ingest/ingestScheduler.js";
import {
  approveIngestItem,
  processIngestItem,
  rejectIngestItem,
} from "../services/ingest/processItem.js";
import { promoteIngestItem } from "../services/ingest/promoteItem.js";

const router = Router();

router.get(
  "/ingest/sources",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const sources = await prisma.ingestSource.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { items: true } },
      },
    });
    res.json({ sources });
  }
);

router.post(
  "/ingest/seed-sources",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const result = await seedDefaultIngestSources();
    res.json(result);
  }
);

router.post(
  "/ingest/sources/:id/poll",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const sourceId = param(req, "id");
    const result = await enqueueSourcePoll(sourceId);
    res.json(result);
  }
);

router.get(
  "/ingest/items",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const status = String(req.query.status ?? "").trim() as IngestItemStatus | "";
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));

    const items = await prisma.ingestItem.findMany({
      where: status ? { status } : undefined,
      orderBy: { fetchedAt: "desc" },
      take: limit,
      include: {
        source: { select: { name: true, slug: true, license: true } },
        article: { select: { id: true, slug: true, status: true } },
      },
    });
    res.json({ items });
  }
);

router.patch(
  "/ingest/items/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    const { shelfSummary, tags } = req.body as {
      shelfSummary?: string;
      tags?: string[];
    };

    const item = await prisma.ingestItem.update({
      where: { id },
      data: {
        ...(typeof shelfSummary === "string" ? { shelfSummary } : {}),
        ...(Array.isArray(tags) ? { tags } : {}),
      },
    });
    res.json({ item });
  }
);

router.post(
  "/ingest/items/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    await approveIngestItem(id);
    res.json({ ok: true });
  }
);

router.post(
  "/ingest/items/:id/reject",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    await rejectIngestItem(id);
    res.json({ ok: true });
  }
);

router.post(
  "/ingest/items/:id/promote",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    await processIngestItem(id);
    const result = await promoteIngestItem(id);
    res.json(result);
  }
);

router.get(
  "/ingest/jobs",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 30)));
    const jobs = await prisma.ingestJob.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        source: { select: { slug: true, name: true } },
        item: { select: { title: true } },
      },
    });
    res.json({ jobs });
  }
);

export default router;
