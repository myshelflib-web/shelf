import type { QuizQuestion } from "@prisma/client";
import { StudyGoal } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { completeChat, type ChatContentPart } from "../llm.js";
import { getObjectBuffer } from "../s3.js";
import { logger, errorFields } from "../../utils/logger.js";
import { quizFlow } from "../../utils/flowLog.js";
import { assertLlmBudget, chargeLlmTokens } from "../../utils/llmUsage.js";
import { parseGradeJson } from "./quizParse.js";
import { billedQuizTokens } from "./quizTokens.js";
import { gradeWrittenSystemPrompt } from "./quizPrompt.js";
import { apiKeyRouteForUser } from "../apiKeyRoute.js";
import type { ApiKeyRoute } from "../apiKeyRoute.js";

function mcqScore(q: QuizQuestion): { score: number; feedback: string } {
  const picked = (q.userAnswerOption ?? "").trim().toUpperCase();
  const key = (q.correctOptionId ?? "").trim().toUpperCase();
  const ok = Boolean(key) && picked === key;
  return {
    score: ok ? 1 : 0,
    feedback: ok
      ? "Correct."
      : key
        ? `Incorrect. The key is ${key}.`
        : "No key was stored for this item.",
  };
}

async function imageDataUrl(key: string, mime: string | null): Promise<string | null> {
  try {
    const { buffer, contentType } = await getObjectBuffer(key);
    const type = mime || contentType || "image/jpeg";
    return `data:${type};base64,${buffer.toString("base64")}`;
  } catch (err) {
    logger.warn("quiz.grade.image_load_failed", { key, ...errorFields(err) });
    return null;
  }
}

async function gradeOpenAnswer(
  q: QuizQuestion,
  goal: StudyGoal,
  apiKeyRoute: ApiKeyRoute
): Promise<{ score: number; feedback: string; tokens: number }> {
  const text = (q.userAnswerText ?? "").trim();
  const hasImage = Boolean(q.userImageKey);
  if (!text && !hasImage) {
    return { score: 0, feedback: "No answer was submitted.", tokens: 0 };
  }

  const gradePrompt = `Question (${q.marks} marks):\n${q.prompt}\n\nMarking scheme:\n${q.modelAnswer || q.explanation || "(none)"}\n\nTyped answer:\n${text || "(none)"}`;
  const parts: ChatContentPart[] = [{ type: "text", text: gradePrompt }];
  if (q.userImageKey) {
    const url = await imageDataUrl(q.userImageKey, q.userImageMime);
    if (url) parts.push({ type: "image_url", image_url: { url } });
  }

  const result = await completeChat(
    [
      { role: "system", content: gradeWrittenSystemPrompt(goal) },
      { role: "user", content: parts },
    ],
    { maxTokens: 512, temperature: 0.1, apiKeyRoute }
  );
  const parsed = parseGradeJson(result.text);
  return {
    score: parsed.score,
    feedback: parsed.feedback,
    tokens: billedQuizTokens(
      result,
      `${gradeWrittenSystemPrompt(goal)}\n${gradePrompt}`
    ),
  };
}

export async function gradeQuiz(quizId: string, userId: string): Promise<void> {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, userId },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!quiz) throw new Error("Quiz not found");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      studyGoal: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      llmTokensUsed: true,
      llmTokensResetAt: true,
    },
  });
  if (!user) throw new Error("User not found");

  await assertLlmBudget(userId, 1);

  let billed = 0;
  for (const q of quiz.questions) {
    if (q.type === "MCQ") {
      const { score, feedback } = mcqScore(q);
      await prisma.quizQuestion.update({
        where: { id: q.id },
        data: { gradedScore: score, gradedFeedback: feedback },
      });
      continue;
    }
    await assertLlmBudget(userId, 1);
    const graded = await gradeOpenAnswer(
      q,
      user.studyGoal,
      apiKeyRouteForUser(user)
    );
    billed += graded.tokens;
    await prisma.quizQuestion.update({
      where: { id: q.id },
      data: {
        gradedScore: graded.score,
        gradedFeedback: graded.feedback,
      },
    });
  }

  if (billed > 0) {
    await chargeLlmTokens(userId, billed);
  }

  await prisma.quiz.update({
    where: { id: quizId },
    data: {
      status: "GRADED",
      submittedAt: quiz.submittedAt ?? new Date(),
    },
  });

  quizFlow.graded(logger, {
    quizId,
    userId,
    questionCount: quiz.questions.length,
    llmTokensBilled: billed,
  });
}
