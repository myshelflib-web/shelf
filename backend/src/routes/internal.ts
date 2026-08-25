import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { param } from "../utils/param.js";
import { internalAuthMiddleware } from "../middleware/internalAuth.js";
import { scheduleIndexPage } from "../services/libraryIndex.js";
import { runVectorIndexBatch } from "../services/vectorIndexWorker.js";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";

const router = Router();

router.use(internalAuthMiddleware);

router.get("/pending-processing", async (req: Request, res: Response) => {
  const start = Date.now();
  const [adminArticles, userPages] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PROCESSING", pdfKey: { not: null } },
      include: {
        topic: {
          select: {
            slug: true,
            subject: { select: { slug: true } },
          },
        },
      },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),
    prisma.userTopic.findMany({
      where: {
        pdfKey: { not: null },
        contentUrl: null,
        status: { in: ["PUBLISHED", "PROCESSING"] },
      },
      include: {
        userSubject: { select: { slug: true } },
        userTopicGroup: { select: { slug: true } },
      },
      orderBy: { updatedAt: "asc" },
      take: 20,
    }),
  ]);

  const adminJobs = adminArticles.map((article) => ({
    type: "admin" as const,
    topicId: article.id,
    articleId: article.id,
    pdfKey: article.pdfKey!,
    subjectSlug: article.topic.subject.slug,
    topicSlug: article.topic.slug,
    articleSlug: article.slug,
  }));

  const userJobs = userPages.map((page) => ({
    type: "user" as const,
    topicId: page.id,
    pdfKey: page.pdfKey!,
    subjectSlug: page.userSubject?.slug ?? null,
    topicSlug: page.userTopicGroup?.slug ?? null,
    articleSlug: page.slug,
    userId: page.userId,
  }));

  const jobs = [...adminJobs, ...userJobs];

  metrics.inc("internal_pending_polls_total");
  metrics.observe("internal_pending_poll_duration_ms", Date.now() - start);
  (req.log ?? logger).debug("internal.pending_processing", {
    jobCount: jobs.length,
    adminCount: adminArticles.length,
    userCount: userPages.length,
    durationMs: Date.now() - start,
  });

  res.json({ jobs });
});

router.post("/topics/:id/processed", async (req: Request, res: Response) => {
  const { contentUrl, status } = req.body;
  const id = param(req, "id");

  const article = await prisma.article.update({
    where: { id },
    data: {
      contentUrl: contentUrl ?? undefined,
      status: status ?? "PUBLISHED",
    },
  });

  metrics.inc("article_processed_callbacks_total", {
    status: article.status,
    type: "admin",
  });
  (req.log ?? logger).info("internal.article_processed", {
    articleId: article.id,
    status: article.status,
    contentUrl: article.contentUrl,
  });

  res.json({ topic: article, article });
});

router.post("/articles/:id/processed", async (req: Request, res: Response) => {
  const { contentUrl, status } = req.body;
  const id = param(req, "id");

  const article = await prisma.article.update({
    where: { id },
    data: {
      contentUrl: contentUrl ?? undefined,
      status: status ?? "PUBLISHED",
    },
  });

  metrics.inc("article_processed_callbacks_total", {
    status: article.status,
    type: "admin",
  });
  (req.log ?? logger).info("internal.article_processed", {
    articleId: article.id,
    status: article.status,
    contentUrl: article.contentUrl,
  });

  res.json({ article });
});

router.post("/user-topics/:id/processed", async (req: Request, res: Response) => {
  const { contentUrl, status } = req.body;
  const id = param(req, "id");

  const topic = await prisma.userTopic.update({
    where: { id },
    data: {
      contentUrl: contentUrl ?? undefined,
      status: status ?? "PUBLISHED",
    },
  });

  metrics.inc("article_processed_callbacks_total", {
    status: topic.status,
    type: "user",
  });
  (req.log ?? logger).info("internal.user_topic_processed", {
    userTopicId: topic.id,
    status: topic.status,
    contentUrl: topic.contentUrl,
  });

  if (topic.status === "PUBLISHED") {
    scheduleIndexPage(topic.id);
  }

  res.json({ topic });
});

router.post("/vector/reindex-batch", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.body?.limit ?? 10), 50);
  const indexed = await runVectorIndexBatch(limit);
  res.json({ indexed, limit });
});

export default router;
