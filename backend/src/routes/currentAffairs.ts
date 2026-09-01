import { Router, Request, Response } from "express";
import { StudyGoal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { isStudyGoal } from "../studyGoal.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const goalRaw = String(req.query.goal ?? "UPSC").toUpperCase();
  const goal: StudyGoal = isStudyGoal(goalRaw) ? goalRaw : "UPSC";

  const fromRaw = String(req.query.from ?? "").trim();
  const toRaw = String(req.query.to ?? "").trim();
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 40)));

  const from = fromRaw ? new Date(fromRaw) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toRaw ? new Date(toRaw) : new Date();

  const items = await prisma.ingestItem.findMany({
    where: {
      status: { in: ["PUBLISHED", "APPROVED"] },
      studyGoals: { has: goal },
      OR: [
        { publishedAtShelf: { gte: from, lte: to } },
        { publishedAt: { gte: from, lte: to } },
      ],
    },
    orderBy: [{ publishedAtShelf: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: {
      id: true,
      title: true,
      canonicalUrl: true,
      shelfSummary: true,
      factualExcerpt: true,
      license: true,
      tags: true,
      studyGoals: true,
      edition: true,
      publishedAt: true,
      publishedAtShelf: true,
      articleId: true,
      source: { select: { name: true, slug: true } },
    },
  });

  res.json({
    goal,
    from: from.toISOString(),
    to: to.toISOString(),
    items: items.map((item) => ({
      ...item,
      disclaimer:
        item.license === "LINK_ONLY"
          ? "Link and Shelf summary only — read full text at the source."
          : item.license === "GOVERNMENT_PRESS"
            ? "Government press release — excerpt and link; open source for full text."
            : "Official document — see Learn reader or source link.",
    })),
  });
});

export default router;
