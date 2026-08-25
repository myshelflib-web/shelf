import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";

const router = Router();

router.post(
  "/:articleId",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { completed, readPercent } = req.body;
    const articleId = param(req, "articleId");

    const progress = await prisma.userProgress.upsert({
      where: {
        userId_articleId: {
          userId: req.user!.userId,
          articleId,
        },
      },
      update: {
        completed: completed ?? undefined,
        readPercent: readPercent ?? undefined,
        completedAt: completed ? new Date() : undefined,
      },
      create: {
        userId: req.user!.userId,
        articleId,
        completed: completed ?? false,
        readPercent: readPercent ?? 0,
        completedAt: completed ? new Date() : undefined,
      },
    });

    res.json({ progress });
  }
);

router.post(
  "/:articleId/star",
  authMiddleware,
  async (req: Request, res: Response) => {
    const articleId = param(req, "articleId");
    const userId = req.user!.userId;

    const existing = await prisma.starredArticle.findUnique({
      where: { userId_articleId: { userId, articleId } },
    });

    if (existing) {
      await prisma.starredArticle.delete({
        where: { userId_articleId: { userId, articleId } },
      });
      res.json({ starred: false });
    } else {
      await prisma.starredArticle.create({ data: { userId, articleId } });
      res.json({ starred: true });
    }
  }
);

router.get("/summary", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const [completedCount, totalPublished, starredCount] = await Promise.all([
    prisma.userProgress.count({ where: { userId, completed: true } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.starredArticle.count({ where: { userId } }),
  ]);

  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: {
      topics: {
        select: {
          articles: {
            where: { status: "PUBLISHED" },
            select: { id: true },
          },
        },
      },
    },
  });

  const progressBySubject = await Promise.all(
    subjects.map(async (subject) => {
      const articleIds = subject.topics.flatMap((t) =>
        t.articles.map((a) => a.id)
      );
      const completed = await prisma.userProgress.count({
        where: {
          userId,
          articleId: { in: articleIds },
          completed: true,
        },
      });
      return {
        subjectId: subject.id,
        slug: subject.slug,
        name: subject.name,
        completed,
        total: articleIds.length,
      };
    })
  );

  res.json({
    completedCount,
    totalPublished,
    starredCount,
    overallPercent:
      totalPublished > 0
        ? Math.round((completedCount / totalPublished) * 100)
        : 0,
    progressBySubject,
  });
});

export default router;
