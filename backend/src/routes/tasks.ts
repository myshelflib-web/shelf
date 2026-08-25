import { Router, Request, Response } from "express";
import { StudyItemKind } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import {
  masterId,
  parseRecurrence,
} from "../utils/recurrence.js";
import { rangedTaskWhere, mergeRangedTasks } from "../utils/plannerTasks.js";

function parseKind(value: unknown): StudyItemKind {
  return value === "EVENT" ? StudyItemKind.EVENT : StudyItemKind.TASK;
}

const router = Router();
router.use(authMiddleware);

function articleHref(article: {
  slug: string;
  topic: { slug: string; subject: { slug: string } };
}): string {
  return `/learn/${article.topic.subject.slug}/${article.topic.slug}/${article.slug}`;
}

const taskInclude = {
  article: {
    select: {
      id: true,
      title: true,
      slug: true,
      topic: {
        select: {
          slug: true,
          title: true,
          subject: { select: { slug: true, name: true } },
        },
      },
    },
  },
} as const;

function serialize(
  task: {
    href: string | null;
    article: {
      slug: string;
      topic: { slug: string; subject: { slug: string } };
    } | null;
  } & Record<string, unknown>
) {
  return {
    ...task,
    href: task.href ?? (task.article ? articleHref(task.article) : null),
  };
}

router.get("/", async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;
  const ranged =
    from &&
    to &&
    !Number.isNaN(from.getTime()) &&
    !Number.isNaN(to.getTime());

  const tasks = await prisma.studyTask.findMany({
    where: {
      userId: req.user!.userId,
      ...(ranged ? rangedTaskWhere(from!, to!) : {}),
    },
    orderBy: { dueAt: "asc" },
    include: taskInclude,
  });

  const mapped = ranged
    ? mergeRangedTasks(tasks, from!, to!).map((t) => serialize(t))
    : tasks.map((t) => serialize(t));

  res.json({ tasks: mapped });
});

router.post("/", async (req: Request, res: Response) => {
  const { title, notes, dueAt, endsAt, articleId, href, kind, recurrence, recurUntil } =
    req.body as {
      title?: string;
      notes?: string;
      dueAt?: string;
      endsAt?: string;
      articleId?: string;
      href?: string;
      kind?: string;
      recurrence?: string;
      recurUntil?: string | null;
    };

  if (!title?.trim()) {
    res.status(400).json({ error: "title required" });
    return;
  }

  let due: Date | null = null;
  if (dueAt) {
    due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) {
      res.status(400).json({ error: "Invalid dueAt" });
      return;
    }
  }

  let end: Date | null = null;
  if (endsAt) {
    end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) {
      res.status(400).json({ error: "Invalid endsAt" });
      return;
    }
  }

  const itemKind = parseKind(kind);
  const rec =
    itemKind === StudyItemKind.EVENT ? parseRecurrence(recurrence) : "NONE";
  if (rec !== "NONE" && !due) {
    res.status(400).json({ error: "Recurring events require dueAt" });
    return;
  }
  let until: Date | null = null;
  if (itemKind === StudyItemKind.EVENT && rec !== "NONE" && recurUntil) {
    until = new Date(recurUntil);
    if (Number.isNaN(until.getTime())) {
      res.status(400).json({ error: "Invalid recurUntil" });
      return;
    }
  }

  let resolvedHref = href?.trim() || null;
  let resolvedArticle = itemKind === StudyItemKind.TASK ? articleId || null : null;
  if (itemKind === StudyItemKind.EVENT) {
    resolvedArticle = null;
  } else if (articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        topic: { select: { slug: true, subject: { select: { slug: true } } } },
      },
    });
    if (!article) {
      res.status(404).json({ error: "Article not found" });
      return;
    }
    resolvedHref = articleHref(article);
  }

  const task = await prisma.studyTask.create({
    data: {
      userId: req.user!.userId,
      title: title.trim(),
      notes: notes?.trim() || null,
      kind: itemKind,
      dueAt: due,
      endsAt: end,
      articleId: resolvedArticle,
      href: resolvedHref,
      recurrence: rec,
      recurUntil: until,
    },
    include: taskInclude,
  });

  res.status(201).json({ task: serialize(task) });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const id = masterId(param(req, "id"));
  const existing = await prisma.studyTask.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const { title, notes, dueAt, endsAt, completed, articleId, href, kind, recurrence, recurUntil } =
    req.body as {
      title?: string;
      notes?: string;
      dueAt?: string | null;
      endsAt?: string | null;
      completed?: boolean;
      articleId?: string | null;
      href?: string | null;
      kind?: string;
      recurrence?: string;
      recurUntil?: string | null;
    };

  let due: Date | null | undefined = undefined;
  if (dueAt !== undefined) {
    if (dueAt === null || dueAt === "") due = null;
    else {
      due = new Date(dueAt);
      if (Number.isNaN(due.getTime())) {
        res.status(400).json({ error: "Invalid dueAt" });
        return;
      }
    }
  }

  const nextKind = kind === undefined ? existing.kind : parseKind(kind);
  let resolvedHref = href === undefined ? undefined : href;
  let resolvedArticle = articleId === undefined ? undefined : articleId;
  if (nextKind === StudyItemKind.EVENT) {
    resolvedArticle = null;
  } else if (articleId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        topic: { select: { slug: true, subject: { select: { slug: true } } } },
      },
    });
    if (article) resolvedHref = articleHref(article);
  }

  const rec =
    recurrence === undefined
      ? undefined
      : nextKind === StudyItemKind.EVENT
        ? parseRecurrence(recurrence)
        : "NONE";

  let until: Date | null | undefined = undefined;
  if (recurUntil !== undefined) {
    if (!recurUntil || rec === "NONE") until = null;
    else {
      until = new Date(recurUntil);
      if (Number.isNaN(until.getTime())) {
        res.status(400).json({ error: "Invalid recurUntil" });
        return;
      }
    }
  }

  const appliedRec = rec !== undefined ? rec : existing.recurrence;
  const appliedDue = due !== undefined ? due : existing.dueAt;
  if (nextKind === StudyItemKind.EVENT && appliedRec !== "NONE" && !appliedDue) {
    res.status(400).json({ error: "Recurring events require dueAt" });
    return;
  }

  const task = await prisma.studyTask.update({
    where: { id },
    data: {
      title: title?.trim() ?? undefined,
      notes: notes === undefined ? undefined : notes,
      kind: kind === undefined ? undefined : parseKind(kind),
      dueAt: due,
      endsAt:
        endsAt === undefined
          ? undefined
          : endsAt
            ? new Date(endsAt)
            : null,
      completed: completed ?? undefined,
      articleId: resolvedArticle,
      href: resolvedHref,
      recurrence: rec,
      recurUntil: until,
    },
    include: taskInclude,
  });

  res.json({ task: serialize(task) });
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = masterId(param(req, "id"));
  const existing = await prisma.studyTask.findFirst({
    where: { id, userId: req.user!.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  await prisma.studyTask.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
