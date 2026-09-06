import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { publicLearnSubjectWhere } from "../services/contentGen/publicLearnSubject.js";
import { submitIndexNow } from "../services/indexNow.js";
import { logger } from "../utils/logger.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.js";

const router = Router();

router.use(internalAuthMiddleware);

const BATCH = 10_000;

/**
 * Backfill IndexNow for public Learn URLs (subjects, topics, articles).
 * POST /api/internal/indexnow/learn  (INTERNAL_SECRET)
 * Optional body: { limit?: number } — max paths to submit (default all, capped 10k/batch).
 */
router.post("/indexnow/learn", async (req: Request, res: Response) => {
  const limitRaw = Number(req.body?.limit);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), BATCH)
      : BATCH;

  const subjects = await prisma.subject.findMany({
    where: publicLearnSubjectWhere(),
    select: {
      slug: true,
      topics: {
        select: {
          slug: true,
          articles: {
            where: { status: "PUBLISHED" },
            select: { slug: true },
          },
        },
      },
    },
  });

  const paths: string[] = [];
  for (const subject of subjects) {
    const topics = subject.topics.filter((t) => t.articles.length > 0);
    if (topics.length === 0) continue;
    paths.push(`/learn/${subject.slug}`);
    for (const topic of topics) {
      paths.push(`/learn/${subject.slug}/${topic.slug}`);
      for (const article of topic.articles) {
        paths.push(`/learn/${subject.slug}/${topic.slug}/${article.slug}`);
      }
    }
    if (paths.length >= limit) break;
  }

  const slice = paths.slice(0, limit);
  const submitted = await submitIndexNow(slice);
  (req.log ?? logger).info("internal.indexnow.learn", {
    paths: slice.length,
    submitted,
  });
  res.json({ paths: slice.length, submitted });
});

export default router;
