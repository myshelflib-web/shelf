import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";
import {
  getFromS3,
  headObjectMeta,
  getObjectStream,
  getPresignedPdfGetUrl,
  PDF_PRESIGN_EXPIRES_SEC,
} from "../services/s3.js";
import { isPremiumUser, truncateHtmlPreview } from "../utils/paywall.js";
import { param } from "../utils/param.js";
import { isStudyGoal } from "../studyGoal.js";
import { parseBytesRange } from "../utils/byteRange.js";

const router = Router();

async function fetchArticleContent(
  contentUrl: string | null
): Promise<string | null> {
  if (!contentUrl) return null;
  try {
    return await getFromS3(contentUrl);
  } catch {
    return null;
  }
}

const articleListSelect = {
  id: true,
  title: true,
  slug: true,
  order: true,
  isPremium: true,
} as const;

const topicWithArticlesSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  order: true,
  articles: {
    where: { status: "PUBLISHED" as const },
    orderBy: { order: "asc" as const },
    select: articleListSelect,
  },
} as const;

router.get("/", async (req: Request, res: Response) => {
  const rawGoal = typeof req.query.studyGoal === "string" ? req.query.studyGoal : null;
  const where =
    rawGoal && isStudyGoal(rawGoal) ? { studyGoal: rawGoal } : undefined;

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { order: "asc" },
    include: {
      topics: {
        orderBy: { order: "asc" },
        select: topicWithArticlesSelect,
      },
    },
  });
  res.json({ subjects });
});

router.get("/:slug", async (req: Request, res: Response) => {
  const subject = await prisma.subject.findUnique({
    where: { slug: param(req, "slug") },
    include: {
      topics: {
        orderBy: { order: "asc" },
        select: topicWithArticlesSelect,
      },
    },
  });

  if (!subject) {
    res.status(404).json({ error: "Subject not found" });
    return;
  }
  res.json({ subject });
});

router.get(
  "/:subjectSlug/topics/:topicSlug",
  async (req: Request, res: Response) => {
    const subjectSlug = param(req, "subjectSlug");
    const topicSlug = param(req, "topicSlug");

    const subject = await prisma.subject.findUnique({
      where: { slug: subjectSlug },
    });
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const topic = await prisma.topic.findUnique({
      where: {
        subjectId_slug: {
          subjectId: subject.id,
          slug: topicSlug,
        },
      },
      include: {
        subject: { select: { name: true, slug: true, icon: true, studyGoal: true } },
        articles: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: articleListSelect,
        },
      },
    });

    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    res.json({ topic });
  }
);

router.get(
  "/:subjectSlug/topics/:topicSlug/articles/:articleSlug",
  optionalAuthMiddleware,
  async (req: Request, res: Response) => {
    const subjectSlug = param(req, "subjectSlug");
    const topicSlug = param(req, "topicSlug");
    const articleSlug = param(req, "articleSlug");

    const subject = await prisma.subject.findUnique({
      where: { slug: subjectSlug },
    });
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return;
    }

    const topic = await prisma.topic.findUnique({
      where: {
        subjectId_slug: {
          subjectId: subject.id,
          slug: topicSlug,
        },
      },
    });
    if (!topic) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }

    const article = await prisma.article.findUnique({
      where: {
        topicId_slug: {
          topicId: topic.id,
          slug: articleSlug,
        },
      },
      include: {
        topic: {
          select: {
            title: true,
            slug: true,
            subject: { select: { name: true, slug: true, icon: true, studyGoal: true } },
          },
        },
      },
    });

    if (!article || article.status !== "PUBLISHED") {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const userId = req.user?.userId;
    const dbUser = userId
      ? await prisma.user.findUnique({
          where: { id: userId },
          select: { plan: true, role: true, subscriptionExpiresAt: true },
        })
      : null;

    const userIsPremium = dbUser ? isPremiumUser(dbUser) : false;
    const isLocked = article.isPremium && !userIsPremium;

    const [progress, starred, allArticles, fullContent] = await Promise.all([
      userId
        ? prisma.userProgress.findUnique({
            where: {
              userId_articleId: {
                userId,
                articleId: article.id,
              },
            },
          })
        : Promise.resolve(null),
      userId
        ? prisma.starredArticle.findUnique({
            where: {
              userId_articleId: {
                userId,
                articleId: article.id,
              },
            },
          })
        : Promise.resolve(null),
      prisma.article.findMany({
        where: { topicId: topic.id, status: "PUBLISHED" },
        orderBy: { order: "asc" },
        select: { slug: true, title: true, order: true, isPremium: true },
      }),
      fetchArticleContent(article.contentUrl),
    ]);

    const currentIndex = allArticles.findIndex((a) => a.slug === article.slug);
    const prev = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
    const next =
      currentIndex < allArticles.length - 1
        ? allArticles[currentIndex + 1]
        : null;

    let content = fullContent;
    if (isLocked && fullContent) {
      content = truncateHtmlPreview(fullContent, article.previewPercent);
    }

    res.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content,
        contentUrl: article.contentUrl,
        hasPdf: Boolean(article.pdfKey),
        isPremium: article.isPremium,
        isLocked,
        previewPercent: article.previewPercent,
        topic: article.topic,
      },
      progress: progress ?? { completed: false, readPercent: 0 },
      starred: !!starred,
      navigation: { prev, next },
      userPlan: dbUser?.plan ?? "FREE",
      isPremium: userIsPremium,
      requiresLogin: !userId,
    });
  }
);

async function resolveArticleBySlugs(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
) {
  const subject = await prisma.subject.findUnique({
    where: { slug: subjectSlug },
  });
  if (!subject) return null;

  const topic = await prisma.topic.findUnique({
    where: {
      subjectId_slug: {
        subjectId: subject.id,
        slug: topicSlug,
      },
    },
  });
  if (!topic) return null;

  const article = await prisma.article.findUnique({
    where: {
      topicId_slug: {
        topicId: topic.id,
        slug: articleSlug,
      },
    },
    include: {
      topic: {
        select: {
          title: true,
          slug: true,
          subject: { select: { name: true, slug: true, icon: true, studyGoal: true } },
        },
      },
    },
  });
  if (!article) return null;
  return { subject, topic, article };
}

type ResolvedArticle = NonNullable<
  Awaited<ReturnType<typeof resolveArticleBySlugs>>
>;

async function authorizeArticlePdf(
  req: Request,
  res: Response
): Promise<ResolvedArticle | null> {
  const resolved = await resolveArticleBySlugs(
    param(req, "subjectSlug"),
    param(req, "topicSlug"),
    param(req, "articleSlug")
  );
  if (!resolved?.article.pdfKey || resolved.article.status !== "PUBLISHED") {
    res.status(404).json({ error: "PDF not found" });
    return null;
  }

  const userId = req.user?.userId;
  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, role: true, subscriptionExpiresAt: true },
      })
    : null;
  const userIsPremium = dbUser ? isPremiumUser(dbUser) : false;
  if (resolved.article.isPremium && !userIsPremium) {
    res.status(403).json({ error: "Premium article" });
    return null;
  }
  return resolved;
}

async function sendArticlePdfUrl(req: Request, res: Response) {
  const resolved = await authorizeArticlePdf(req, res);
  if (!resolved?.article.pdfKey) return;
  try {
    const url = await getPresignedPdfGetUrl(resolved.article.pdfKey);
    res.json({
      url,
      expiresIn: PDF_PRESIGN_EXPIRES_SEC,
      version: resolved.article.pdfKey,
    });
  } catch {
    res.status(500).json({ error: "Could not open PDF" });
  }
}

async function streamArticlePdf(req: Request, res: Response) {
  const resolved = await authorizeArticlePdf(req, res);
  if (!resolved?.article.pdfKey) return;

  const pdfKey = resolved.article.pdfKey;
  try {
    const meta = await headObjectMeta(pdfKey);
    const size = meta.contentLength;
    const contentType = meta.contentType || "application/pdf";
    const etagToken = meta.etag || pdfKey;
    const etagHeader = `"${etagToken}"`;
    const rangeHeader = req.headers.range;
    const ifNoneMatch = req.headers["if-none-match"];

    res.setHeader("Cache-Control", "private, max-age=86400");
    res.setHeader("ETag", etagHeader);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Accept-Ranges, Content-Range, Content-Length, Content-Type, ETag"
    );

    const clientTags = (ifNoneMatch || "")
      .split(",")
      .map((t) => t.trim().replace(/^W\//, "").replace(/"/g, ""));
    if (
      !rangeHeader &&
      clientTags.length > 0 &&
      (clientTags.includes(etagToken) || clientTags.includes("*"))
    ) {
      res.status(304).end();
      return;
    }

    if (req.method === "HEAD") {
      res.setHeader("Content-Length", String(size));
      res.status(200).end();
      return;
    }

    const parsed = parseBytesRange(rangeHeader, size);
    if (parsed === "unsatisfiable") {
      res.setHeader("Content-Range", `bytes */${size}`);
      res.status(416).end();
      return;
    }

    if (parsed) {
      const { start, end } = parsed;
      const { body, contentLength, contentRange } = await getObjectStream(
        pdfKey,
        { range: `bytes=${start}-${end}` }
      );
      res.status(206);
      res.setHeader(
        "Content-Range",
        contentRange ?? `bytes ${start}-${end}/${size}`
      );
      res.setHeader(
        "Content-Length",
        String(contentLength ?? end - start + 1)
      );
      body.pipe(res);
      return;
    }

    const { body, contentLength } = await getObjectStream(pdfKey);
    res.status(200);
    res.setHeader("Content-Length", String(contentLength ?? size));
    body.pipe(res);
  } catch {
    res.status(500).json({ error: "Failed to stream PDF" });
  }
}

router.get(
  "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/pdf-url",
  optionalAuthMiddleware,
  sendArticlePdfUrl
);
router.get(
  "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/pdf",
  optionalAuthMiddleware,
  streamArticlePdf
);
router.head(
  "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/pdf",
  optionalAuthMiddleware,
  streamArticlePdf
);

export default router;
