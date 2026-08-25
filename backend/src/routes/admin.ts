import { Router, Request, Response } from "express";
import multer from "multer";
import prisma from "../utils/prisma.js";
import { uploadToS3, deleteFromS3 } from "../services/s3.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { slugify } from "../utils/slugify.js";
import { logger, errorFields } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";
import {
  adminDocPrefix,
  sourcePdfKey,
  contentKeyFromPdfKey,
} from "../utils/docPaths.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get(
  "/hierarchy",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const subjects = await prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: {
        topics: {
          orderBy: { order: "asc" },
          include: {
            articles: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                slug: true,
                order: true,
                status: true,
                isPremium: true,
              },
            },
          },
        },
      },
    });
    res.json({ subjects });
  }
);

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const [
      totalArticles,
      published,
      processing,
      failed,
      draft,
      subjects,
      recentArticles,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({ where: { status: "PROCESSING" } }),
      prisma.article.count({ where: { status: "FAILED" } }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.subject.count(),
      prisma.article.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          topic: {
            select: {
              title: true,
              slug: true,
              subject: { select: { name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    res.json({
      stats: {
        totalTopics: totalArticles,
        published,
        processing,
        failed,
        draft,
        subjects,
      },
      recentTopics: recentArticles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        order: a.order,
        isPremium: a.isPremium,
        previewPercent: a.previewPercent,
        pdfKey: a.pdfKey,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        subject: a.topic.subject,
        topic: { title: a.topic.title, slug: a.topic.slug },
      })),
    });
  }
);

async function resolveSubject(body: {
  subjectId?: string;
  subjectName?: string;
}) {
  if (body.subjectId) {
    const subject = await prisma.subject.findUnique({
      where: { id: body.subjectId },
    });
    if (!subject) throw new Error("Subject not found");
    return subject;
  }

  const name = body.subjectName?.trim();
  if (!name) throw new Error("subjectId or subjectName required");

  const slug = slugify(name);
  if (!slug) throw new Error("Invalid subject name");

  return prisma.subject.upsert({
    where: { slug },
    update: {},
    create: {
      name,
      slug,
      order: (await prisma.subject.count()) + 1,
      icon: "📚",
    },
  });
}

async function resolveTopic(
  subjectId: string,
  body: { topicId?: string; topicName?: string }
) {
  if (body.topicId) {
    const topic = await prisma.topic.findFirst({
      where: { id: body.topicId, subjectId },
    });
    if (!topic) throw new Error("Topic not found");
    return topic;
  }

  const title = body.topicName?.trim();
  if (!title) throw new Error("topicId or topicName required");

  const slug = slugify(title);
  if (!slug) throw new Error("Invalid topic name");

  return prisma.topic.upsert({
    where: { subjectId_slug: { subjectId, slug } },
    update: {},
    create: {
      subjectId,
      title,
      slug,
      order: (await prisma.topic.count({ where: { subjectId } })) + 1,
    },
  });
}

router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("pdf"),
  async (req: Request, res: Response) => {
    const {
      subjectId,
      subjectName,
      topicId,
      topicName,
      articleId,
      articleTitle,
      articleSlug,
      isPremium,
    } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "pdf file required" });
      return;
    }

    if (file.mimetype !== "application/pdf") {
      res.status(400).json({ error: "Only PDF files allowed" });
      return;
    }

    try {
      const subject = await resolveSubject({ subjectId, subjectName });
      const topic = await resolveTopic(subject.id, { topicId, topicName });

      let article;
      if (articleId) {
        article = await prisma.article.findFirst({
          where: { id: articleId, topicId: topic.id },
        });
        if (!article) {
          res.status(404).json({ error: "Article not found" });
          return;
        }
      } else {
        const title = String(articleTitle ?? "").trim();
        if (!title) {
          res.status(400).json({ error: "articleTitle or articleId required" });
          return;
        }
        const slug = slugify(String(articleSlug || title));
        if (!slug) {
          res.status(400).json({ error: "Invalid article title" });
          return;
        }

        article = await prisma.article.findUnique({
          where: { topicId_slug: { topicId: topic.id, slug } },
        });

        if (!article) {
          article = await prisma.article.create({
            data: {
              topicId: topic.id,
              title,
              slug,
              status: "PROCESSING",
              isPremium: isPremium === "true" || isPremium === true,
              order:
                (await prisma.article.count({ where: { topicId: topic.id } })) +
                1,
            },
          });
        } else {
          article = await prisma.article.update({
            where: { id: article.id },
            data: {
              title,
              status: "PROCESSING",
              contentUrl: null,
              isPremium:
                isPremium === undefined
                  ? article.isPremium
                  : isPremium === "true" || isPremium === true,
            },
          });
        }
      }

      const docPrefix = adminDocPrefix(subject.slug, topic.slug, article.slug);
      const pdfKey = sourcePdfKey(docPrefix);
      await uploadToS3(pdfKey, file.buffer, "application/pdf");

      article = await prisma.article.update({
        where: { id: article.id },
        data: {
          pdfKey,
          status: "PROCESSING",
          contentUrl: null,
        },
        include: {
          topic: {
            select: {
              title: true,
              slug: true,
              subject: { select: { name: true, slug: true } },
            },
          },
        },
      });

      metrics.inc("admin_uploads_total", { ok: true });
      (req.log ?? logger).info("admin.upload.ok", {
        articleId: article.id,
        subjectSlug: subject.slug,
        topicSlug: topic.slug,
        articleSlug: article.slug,
        pdfKey,
        bytes: file.size,
      });

      res.status(201).json({
        article,
        message:
          "PDF uploaded to S3. The processor will convert it to HTML shortly.",
      });
    } catch (err) {
      metrics.inc("admin_uploads_total", { ok: false });
      (req.log ?? logger).error("admin.upload.failed", errorFields(err));
      const message = err instanceof Error ? err.message : "Upload failed";
      const status =
        message.includes("not found") || message.includes("required")
          ? 400
          : 500;
      res.status(status).json({ error: message });
    }
  }
);

router.get(
  "/articles",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const articles = await prisma.article.findMany({
      orderBy: [
        { topic: { subject: { order: "asc" } } },
        { topic: { order: "asc" } },
        { order: "asc" },
      ],
      include: {
        topic: {
          select: {
            title: true,
            slug: true,
            subject: { select: { name: true, slug: true } },
          },
        },
      },
    });

    res.json({
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        order: a.order,
        isPremium: a.isPremium,
        previewPercent: a.previewPercent,
        pdfKey: a.pdfKey,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        subject: a.topic.subject,
        topic: { title: a.topic.title, slug: a.topic.slug },
      })),
      // backwards-compatible alias used by older admin UI
      topics: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        order: a.order,
        isPremium: a.isPremium,
        previewPercent: a.previewPercent,
        pdfKey: a.pdfKey,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        subject: a.topic.subject,
        topic: { title: a.topic.title, slug: a.topic.slug },
      })),
    });
  }
);

// Keep /topics as alias for articles during transition
router.get(
  "/topics",
  authMiddleware,
  adminMiddleware,
  async (_req: Request, res: Response) => {
    const articles = await prisma.article.findMany({
      orderBy: [
        { topic: { subject: { order: "asc" } } },
        { topic: { order: "asc" } },
        { order: "asc" },
      ],
      include: {
        topic: {
          select: {
            title: true,
            slug: true,
            subject: { select: { name: true, slug: true } },
          },
        },
      },
    });

    res.json({
      topics: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        order: a.order,
        isPremium: a.isPremium,
        previewPercent: a.previewPercent,
        pdfKey: a.pdfKey,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        subject: a.topic.subject,
        topic: { title: a.topic.title, slug: a.topic.slug },
      })),
    });
  }
);

router.patch(
  "/topics/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const { title, status, order, isPremium, previewPercent } = req.body;
    const id = param(req, "id");
    const article = await prisma.article.update({
      where: { id },
      data: { title, status, order, isPremium, previewPercent },
      include: {
        topic: {
          select: {
            title: true,
            slug: true,
            subject: { select: { name: true, slug: true } },
          },
        },
      },
    });
    res.json({
      topic: {
        ...article,
        subject: article.topic.subject,
        topic: { title: article.topic.title, slug: article.topic.slug },
      },
      article,
    });
  }
);

router.post(
  "/topics/:id/reprocess",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    const article = await prisma.article.findUnique({ where: { id } });

    if (!article || !article.pdfKey) {
      res.status(404).json({ error: "Article or PDF not found" });
      return;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { status: "PROCESSING", contentUrl: null },
    });

    res.json({
      success: true,
      status: "PROCESSING",
      message: "Queued for reprocessing. The worker will pick it up shortly.",
    });
  }
);

router.delete(
  "/topics/:id",
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const id = param(req, "id");
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    if (article.pdfKey) {
      await deleteFromS3(article.pdfKey).catch(() => {});
    }
    if (article.contentUrl) {
      await deleteFromS3(article.contentUrl).catch(() => {});
    } else if (article.pdfKey) {
      await deleteFromS3(contentKeyFromPdfKey(article.pdfKey)).catch(() => {});
    }

    await prisma.article.delete({ where: { id } });
    res.json({ success: true });
  }
);

export default router;
