import { Router, Request, Response } from "express";
import multer from "multer";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { QuotaError, assertStorageRoom } from "../utils/quotas.js";
import {
  assertChatContextOwned,
  type ChatContextKind,
} from "../utils/chatContext.js";
import { extractRelevancyText } from "../utils/relevancyExtract.js";
import { deleteFromS3, uploadToS3 } from "../services/s3.js";
import { losslessCompressBuffer } from "../utils/losslessCompress.js";
import {
  clampFocus,
  clampQuestionCounts,
  parseDifficulty,
  parseSourceKind,
  parseTimeLimitSec,
} from "../services/quiz/quizLimits.js";
import { generateQuizPaper, prepareQuizUser, scheduleQuizGeneration } from "../services/quiz/quizGenerate.js";
import { gradeQuiz } from "../services/quiz/quizGrade.js";
import {
  shouldReveal,
  toClientQuiz,
} from "../services/quiz/quizSerialize.js";

const router = Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function asKind(raw: unknown): ChatContextKind {
  const k = String(raw ?? "LIBRARY").toUpperCase();
  if (k === "NOTEBOOK" || k === "TOPIC" || k === "PAGE") return k;
  return "LIBRARY";
}

async function loadOwnedQuiz(userId: string, id: string) {
  return prisma.quiz.findFirst({
    where: { id, userId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
}

router.get("/", async (req: Request, res: Response) => {
  const quizzes = await prisma.quiz.findMany({
    where: { userId: req.user!.userId },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: {
      id: true,
      title: true,
      sourceKind: true,
      sourceLabel: true,
      difficulty: true,
      status: true,
      mcqCount: true,
      writtenCount: true,
      timeLimitSec: true,
      createdAt: true,
      updatedAt: true,
      submittedAt: true,
    },
  });
  res.json({ quizzes });
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const sourceKind = parseSourceKind(body.sourceKind);
  const difficulty = parseDifficulty(body.difficulty);
  const { mcqCount, writtenCount } = clampQuestionCounts(
    Number(body.mcqCount),
    Number(body.writtenCount)
  );
  const timeLimitSec = parseTimeLimitSec(body.timeLimitSec);
  const focusTopic = clampFocus(body.focusTopic ?? body.focus);
  const contextKind = asKind(body.contextKind);
  const contextNotebookId = String(body.contextNotebookId ?? "").trim() || null;
  const contextTopicId = String(body.contextTopicId ?? "").trim() || null;
  const contextPageId = String(body.contextPageId ?? "").trim() || null;
  const relevancyDocId = String(body.relevancyDocId ?? "").trim() || null;

  try {
    await assertChatContextOwned(userId, {
      contextKind,
      contextNotebookId,
      contextTopicId,
      contextPageId,
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Invalid library scope",
    });
    return;
  }

  if (relevancyDocId) {
    const doc = await prisma.studyRelevancyDoc.findFirst({
      where: { id: relevancyDocId, userId },
      select: { id: true },
    });
    if (!doc) {
      res.status(400).json({ error: "Syllabus doc not found" });
      return;
    }
  }

  let uploadText: string | null = String(body.sourceText ?? "").trim() || null;
  if (req.file) {
    try {
      uploadText = await extractRelevancyText(
        req.file.buffer,
        req.file.originalname || "upload.pdf",
        req.file.mimetype || ""
      );
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Could not read upload",
      });
      return;
    }
  }

  if (sourceKind === "UPLOAD" && !uploadText) {
    res.status(400).json({
      error: "Upload a document or paste source text to quiz on.",
    });
    return;
  }

  try {
    await prepareQuizUser(userId);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }

  const quiz = await prisma.quiz.create({
    data: {
      userId,
      title: "Generating quiz…",
      sourceKind,
      contextKind,
      contextNotebookId: contextKind === "LIBRARY" ? null : contextNotebookId,
      contextTopicId: contextKind === "TOPIC" ? contextTopicId : null,
      contextPageId: contextKind === "PAGE" ? contextPageId : null,
      relevancyDocId,
      focusTopic,
      sourceExcerpt: uploadText,
      difficulty,
      timeLimitSec,
      mcqCount,
      writtenCount,
      status: "GENERATING",
    },
    include: { questions: true },
  });

  scheduleQuizGeneration(quiz.id);
  res.status(201).json({ quiz: await toClientQuiz(quiz, false) });
});

router.get("/:id", async (req: Request, res: Response) => {
  const quiz = await loadOwnedQuiz(req.user!.userId, param(req, "id"));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  res.json({ quiz: await toClientQuiz(quiz, shouldReveal(quiz.status)) });
});

router.post("/:id/retry", async (req: Request, res: Response) => {
  const quiz = await loadOwnedQuiz(req.user!.userId, param(req, "id"));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  if (quiz.status !== "FAILED" && quiz.status !== "GENERATING") {
    res.status(400).json({ error: "Only a failed quiz can be regenerated." });
    return;
  }
  try {
    await prepareQuizUser(req.user!.userId);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
  await prisma.quiz.update({
    where: { id: quiz.id },
    data: { status: "GENERATING", errorMessage: null },
  });
  await generateQuizPaper(quiz.id);
  const next = await loadOwnedQuiz(req.user!.userId, quiz.id);
  res.json({ quiz: await toClientQuiz(next!, shouldReveal(next!.status)) });
});

router.patch("/:id", async (req: Request, res: Response) => {
  const quiz = await loadOwnedQuiz(req.user!.userId, param(req, "id"));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  if (shouldReveal(quiz.status) || quiz.status === "GENERATING" || quiz.status === "FAILED") {
    res.status(400).json({ error: "This quiz can no longer be edited." });
    return;
  }

  const body = req.body as {
    start?: boolean;
    answers?: Array<{
      questionId?: string;
      optionId?: string | null;
      text?: string | null;
    }>;
  };

  const data: {
    status?: "IN_PROGRESS";
    startedAt?: Date;
  } = {};
  if (body.start && !quiz.startedAt) {
    data.startedAt = new Date();
    data.status = "IN_PROGRESS";
  }

  if (body.answers?.length) {
    const byId = new Map(quiz.questions.map((q) => [q.id, q]));
    for (const row of body.answers) {
      const q = byId.get(String(row.questionId ?? ""));
      if (!q) continue;
      await prisma.quizQuestion.update({
        where: { id: q.id },
        data: {
          userAnswerOption:
            row.optionId === undefined
              ? q.userAnswerOption
              : String(row.optionId ?? "").trim().toUpperCase().slice(0, 2) || null,
          userAnswerText:
            row.text === undefined
              ? q.userAnswerText
              : String(row.text ?? "").slice(0, 20_000),
        },
      });
    }
  }

  if (Object.keys(data).length) {
    await prisma.quiz.update({ where: { id: quiz.id }, data });
  }

  const next = await loadOwnedQuiz(req.user!.userId, quiz.id);
  res.json({ quiz: await toClientQuiz(next!, false) });
});

router.post("/:id/submit", async (req: Request, res: Response) => {
  const quiz = await loadOwnedQuiz(req.user!.userId, param(req, "id"));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  if (shouldReveal(quiz.status)) {
    res.json({ quiz: await toClientQuiz(quiz, true) });
    return;
  }
  if (quiz.status === "GENERATING" || quiz.status === "FAILED") {
    res.status(400).json({ error: "Quiz is not ready." });
    return;
  }

  await prisma.quiz.update({
    where: { id: quiz.id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      startedAt: quiz.startedAt ?? new Date(),
    },
  });

  try {
    await gradeQuiz(quiz.id, req.user!.userId);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(503).json({
      error: err instanceof Error ? err.message : "Could not grade this quiz.",
    });
    return;
  }

  const next = await loadOwnedQuiz(req.user!.userId, quiz.id);
  res.json({ quiz: await toClientQuiz(next!, true) });
});

router.post(
  "/:id/questions/:questionId/image",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const quiz = await loadOwnedQuiz(req.user!.userId, param(req, "id"));
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }
    if (shouldReveal(quiz.status)) {
      res.status(400).json({ error: "Quiz already submitted." });
      return;
    }
    const question = quiz.questions.find((q) => q.id === param(req, "questionId"));
    if (!question || question.type === "MCQ") {
      res.status(400).json({ error: "This question does not accept an image." });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Choose an image of your answer." });
      return;
    }
    const mime = (req.file.mimetype || "").toLowerCase();
    if (!IMAGE_TYPES.has(mime)) {
      res.status(400).json({ error: "Upload a JPEG, PNG, or WebP image." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        plan: true,
        role: true,
        subscriptionExpiresAt: true,
        storageUsedBytes: true,
      },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    try {
      assertStorageRoom(user, req.file.size);
    } catch (err) {
      if (err instanceof QuotaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }

    const packed = await losslessCompressBuffer(
      req.file.buffer,
      mime,
      req.file.originalname
    );
    const key = `users/${req.user!.userId}/quiz/${quiz.id}/${question.id}`;
    if (question.userImageKey && question.userImageKey !== key) {
      await deleteFromS3(question.userImageKey).catch(() => undefined);
    }
    await uploadToS3(key, packed, mime);
    await prisma.quizQuestion.update({
      where: { id: question.id },
      data: { userImageKey: key, userImageMime: mime },
    });
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { storageUsedBytes: { increment: packed.length } },
    });
    if (!quiz.startedAt) {
      await prisma.quiz.update({
        where: { id: quiz.id },
        data: { startedAt: new Date(), status: "IN_PROGRESS" },
      });
    }

    const next = await loadOwnedQuiz(req.user!.userId, quiz.id);
    res.json({ quiz: await toClientQuiz(next!, false) });
  }
);

router.delete("/:id", async (req: Request, res: Response) => {
  const quiz = await loadOwnedQuiz(req.user!.userId, param(req, "id"));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  for (const q of quiz.questions) {
    if (q.userImageKey) await deleteFromS3(q.userImageKey).catch(() => undefined);
  }
  await prisma.quiz.delete({ where: { id: quiz.id } });
  res.json({ success: true });
});

export default router;
