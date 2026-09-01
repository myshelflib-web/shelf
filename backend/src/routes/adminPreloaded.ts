import { Router, Request, Response } from "express";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { seedPreloadedCatalog } from "../services/preloaded/seedCatalog.js";
import {
  checkArticleLink,
  migratePreloadedArticlesToLinks,
  runArticleLinkHealthBatch,
} from "../services/preloaded/articleLinkHealth.js";
import prisma from "../utils/prisma.js";
import { param } from "../utils/param.js";

const router = Router();

router.post(
  "/preloaded/seed",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const result = await seedPreloadedCatalog();
    res.json(result);
  }
);

router.post(
  "/preloaded/migrate-links",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const result = await migratePreloadedArticlesToLinks();
    res.json(result);
  }
);

router.post(
  "/preloaded/check-links",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const limit =
      typeof req.body?.limit === "number"
        ? Math.min(100, Math.max(1, req.body.limit))
        : undefined;
    const checked = await runArticleLinkHealthBatch(limit);
    res.json({ checked });
  }
);

router.post(
  "/preloaded/articles/:subjectSlug/:topicSlug/:articleSlug/check-link",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const subjectSlug = param(req, "subjectSlug");
    const topicSlug = param(req, "topicSlug");
    const articleSlug = param(req, "articleSlug");

    const subject = await prisma.subject.findUnique({ where: { slug: subjectSlug } });
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }
    const topic = await prisma.topic.findUnique({
      where: { subjectId_slug: { subjectId: subject.id, slug: topicSlug } },
    });
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    const article = await prisma.article.findUnique({
      where: { topicId_slug: { topicId: topic.id, slug: articleSlug } },
      select: { id: true },
    });
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const result = await checkArticleLink(article.id);
    res.json(result);
  }
);

export default router;
