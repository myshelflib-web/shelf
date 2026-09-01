import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { resolveCurriculumSavePolicy } from "../services/curriculumSavePolicy.js";
import { checkPublicLink } from "../services/publicLinkCheck.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";
import { getFromS3 } from "../services/s3.js";
import { isPremiumUser, truncateHtmlPreview } from "../utils/paywall.js";
import { param } from "../utils/param.js";
import { isStudyGoal } from "../studyGoal.js";
import { registerSubjectArticlePdfRoutes } from "./subjectsArticlePdf.js";
import { buildPreloadedSummaryHtml } from "../services/preloaded/buildSummaryHtml.js";

const router = Router();

function apiBase(req: Request): string {
  const env = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return host ? `${proto}://${host}` : "http://localhost:4000";
}

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
  updatedAt: true,
} as const;

const topicWithArticlesSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  order: true,
  updatedAt: true,
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
        ingestItem: { select: { license: true, embeddable: true, linkStatus: true } },
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

    const savePolicy = resolveCurriculumSavePolicy(article);
    const useLinkEmbed = Boolean(savePolicy.embedUrl);

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
      useLinkEmbed ? Promise.resolve(null) : fetchArticleContent(article.contentUrl),
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
    if (!content && article.summary?.trim()) {
      content = buildPreloadedSummaryHtml(
        article.title,
        savePolicy.embedUrl ?? article.sourceUrl ?? "",
        article.summary
      );
    }

    const embeddable =
      article.embeddable ??
      article.ingestItem?.embeddable ??
      null;

    res.json({
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        content,
        contentUrl: article.contentUrl,
        hasPdf: Boolean(article.pdfKey),
        sourceUrl: savePolicy.embedUrl,
        summary: article.summary,
        sourceLicense: savePolicy.license,
        saveAllowed: savePolicy.allowed,
        saveMode: savePolicy.mode,
        saveReason: savePolicy.reason,
        embeddable,
        linkStatus: article.linkStatus,
        isPremium: article.isPremium,
        isLocked,
        previewPercent: article.previewPercent,
        updatedAt: article.updatedAt.toISOString(),
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

router.get(
  "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/embed-status",
  optionalAuthMiddleware,
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
      select: { id: true, sourceUrl: true, pdfKey: true, status: true },
    });
    if (!article || article.status !== "PUBLISHED") {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const url = article.sourceUrl?.trim();
    if (!url || article.pdfKey) {
      res.json({ embeddable: false, linkStatus: "UNKNOWN", finalUrl: url ?? null });
      return;
    }

    const result = await checkPublicLink(url);
    await prisma.article.update({
      where: { id: article.id },
      data: {
        linkStatus: result.linkStatus,
        embeddable: result.embeddable,
        lastHttpStatus: result.lastHttpStatus,
        lastLinkCheckAt: new Date(),
        sourceUrlChecked: result.finalUrl,
      },
    });
    res.json({
      embeddable: result.embeddable,
      linkStatus: result.linkStatus,
      finalUrl: result.finalUrl,
    });
  }
);

registerSubjectArticlePdfRoutes(router, apiBase);

export default router;
