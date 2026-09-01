import { Router, Request, Response } from "express";
import { Prisma, StudyGoal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { isStudyGoal } from "../studyGoal.js";
import { param } from "../utils/param.js";

const router = Router();

const PUBLIC_STATUSES = ["PUBLISHED", "APPROVED"] as const;

const itemSelect = {
  id: true,
  slug: true,
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
  linkStatus: true,
  embeddable: true,
  lastHttpStatus: true,
  lastLinkCheckAt: true,
  source: { select: { name: true, slug: true } },
  article: {
    select: {
      slug: true,
      topic: {
        select: {
          slug: true,
          subject: { select: { slug: true } },
        },
      },
    },
  },
} as const;

type PublicIngestItem = Prisma.IngestItemGetPayload<{ select: typeof itemSelect }>;

function disclaimerFor(license: string): string {
  if (license === "LINK_ONLY") {
    return "Link and Shelf summary only — read full text at the source.";
  }
  if (license === "GOVERNMENT_PRESS") {
    return "Government press release — excerpt and link; open source for full text.";
  }
  return "Official document — see Learn reader or source link.";
}

function mapPublicItem(item: PublicIngestItem) {
  const learnPath =
    item.article?.topic?.subject?.slug &&
    item.article?.topic?.slug &&
    item.article?.slug
      ? `/learn/${item.article.topic.subject.slug}/${item.article.topic.slug}/${item.article.slug}`
      : null;

  return {
    ...item,
    sharePath: `/learn/current-affairs/${item.slug}`,
    learnPath,
    disclaimer: disclaimerFor(item.license),
  };
}

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
      status: { in: [...PUBLIC_STATUSES] },
      studyGoals: { has: goal },
      OR: [
        { publishedAtShelf: { gte: from, lte: to } },
        { publishedAt: { gte: from, lte: to } },
      ],
    },
    orderBy: [{ publishedAtShelf: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: itemSelect,
  });

  res.json({
    goal,
    from: from.toISOString(),
    to: to.toISOString(),
    items: items.map(mapPublicItem),
  });
});

router.get("/items/:slug", async (req: Request, res: Response) => {
  const slug = param(req, "slug");
  const item = await prisma.ingestItem.findFirst({
    where: { slug, status: { in: [...PUBLIC_STATUSES] } },
    select: itemSelect,
  });
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ item: mapPublicItem(item) });
});

router.get("/items/:slug/embed-status", async (req: Request, res: Response) => {
  const slug = param(req, "slug");
  const item = await prisma.ingestItem.findFirst({
    where: { slug, status: { in: [...PUBLIC_STATUSES] } },
    select: {
      id: true,
      slug: true,
      canonicalUrl: true,
      embeddable: true,
      linkStatus: true,
      lastHttpStatus: true,
      lastLinkCheckAt: true,
    },
  });
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    slug: item.slug,
    url: item.canonicalUrl,
    embeddable: item.embeddable,
    linkStatus: item.linkStatus,
    lastHttpStatus: item.lastHttpStatus,
    lastLinkCheckAt: item.lastLinkCheckAt,
  });
});

export default router;
