import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { completeChat } from "../llm.js";
import { logger, errorFields } from "../../utils/logger.js";
import {
  assertLlmRoom,
  estimateTokens,
  shouldResetLlmWindow,
} from "../../utils/quotas.js";
import { packQuizContext } from "./quizContext.js";
import { parseGeneratedQuiz } from "./quizParse.js";
import {
  quizJsonSchemaInstruction,
  quizSystemPrompt,
} from "./quizPrompt.js";
import type { DraftQuestion } from "./quizLimits.js";

const generating = new Set<string>();

async function chargeTokens(userId: string, tokens: number): Promise<void> {
  if (tokens <= 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: { llmTokensUsed: { increment: tokens } },
  });
}

async function prepareUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      studyGoal: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      llmTokensUsed: true,
      llmTokensResetAt: true,
    },
  });
  if (!user) throw new Error("User not found");
  let tokensUsed = user.llmTokensUsed;
  if (shouldResetLlmWindow(user.llmTokensResetAt)) {
    await prisma.user.update({
      where: { id: userId },
      data: { llmTokensUsed: 0, llmTokensResetAt: new Date() },
    });
    tokensUsed = 0;
  }
  assertLlmRoom({ ...user, llmTokensUsed: tokensUsed });
  return { ...user, llmTokensUsed: tokensUsed };
}

function splitDrafts(questions: DraftQuestion[], mcqCount: number, writtenCount: number) {
  const mcq = questions.filter((q) => q.type === "MCQ").slice(0, mcqCount);
  const written = questions
    .filter((q) => q.type === "WRITTEN" || q.type === "IMAGE")
    .slice(0, writtenCount);
  return [...mcq, ...written];
}

async function callQuizModel(input: {
  system: string;
  excerpt: string;
  instruction: string;
  avoid?: string;
}): Promise<{ questions: DraftQuestion[]; title: string; tokens: number }> {
  const avoid = input.avoid
    ? `\nDo not repeat these stems or topics:\n${input.avoid}`
    : "";
  const material = input.excerpt.trim()
    ? input.excerpt
    : "(Little source text. Write Standard / Practice items strictly from the track syllabus. Mark gaps honestly in sourceTag Practice.)";
  const result = await completeChat(
    [
      { role: "system", content: input.system },
      {
        role: "user",
        content: `${input.instruction}${avoid}\n\nSource material:\n${material}`,
      },
    ],
    { maxTokens: 4096, temperature: 0.45 }
  );
  const parsed = parseGeneratedQuiz(result.text);
  return { ...parsed, tokens: result.tokens || estimateTokens(result.text) };
}

export async function generateQuizPaper(quizId: string): Promise<void> {
  if (generating.has(quizId)) return;
  generating.add(quizId);
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz || quiz.status === "GRADED" || quiz.status === "SUBMITTED") {
      return;
    }

    const user = await prepareUser(quiz.userId);
    const packed = await packQuizContext({
      userId: quiz.userId,
      sourceKind: quiz.sourceKind,
      contextKind: quiz.contextKind,
      contextNotebookId: quiz.contextNotebookId,
      contextTopicId: quiz.contextTopicId,
      contextPageId: quiz.contextPageId,
      relevancyDocId: quiz.relevancyDocId,
      focusTopic: quiz.focusTopic,
      uploadText: quiz.sourceExcerpt,
      studyGoal: user.studyGoal,
    });

    const system = quizSystemPrompt(user.studyGoal, {
      sourceKind: quiz.sourceKind,
      difficulty: quiz.difficulty,
      scopeLabel: packed.scopeLabel,
      syllabusText: packed.syllabusText,
      focusTopic: quiz.focusTopic,
    });

    let tokens = 0;
    let title = quiz.title;
    let drafts: DraftQuestion[] = [];

    if (quiz.mcqCount > 0) {
      const mcq = await callQuizModel({
        system,
        excerpt: packed.excerpt,
        instruction: quizJsonSchemaInstruction(quiz.mcqCount, 0),
      });
      tokens += mcq.tokens;
      title = mcq.title || title;
      drafts.push(...mcq.questions.filter((q) => q.type === "MCQ"));
    }

    if (quiz.writtenCount > 0) {
      const avoid = drafts
        .map((q) => q.prompt.slice(0, 120))
        .slice(0, 12)
        .join("\n");
      const written = await callQuizModel({
        system,
        excerpt: packed.excerpt,
        instruction: quizJsonSchemaInstruction(0, quiz.writtenCount),
        avoid,
      });
      tokens += written.tokens;
      if (!quiz.mcqCount) title = written.title || title;
      drafts.push(
        ...written.questions.filter(
          (q) => q.type === "WRITTEN" || q.type === "IMAGE"
        )
      );
    }

    drafts = splitDrafts(drafts, quiz.mcqCount, quiz.writtenCount);
    if (drafts.length === 0) {
      throw new Error("The model returned no questions. Try a different source.");
    }

    await chargeTokens(quiz.userId, tokens);

    await prisma.$transaction(async (tx) => {
      await tx.quizQuestion.deleteMany({ where: { quizId } });
      await tx.quizQuestion.createMany({
        data: drafts.map((q, i) => ({
          quizId,
          order: i,
          type: q.type,
          prompt: q.prompt,
          options: q.options ? (q.options as Prisma.InputJsonValue) : Prisma.JsonNull,
          correctOptionId: q.correctOptionId ?? null,
          modelAnswer: q.modelAnswer ?? null,
          explanation: q.explanation ?? null,
          marks: q.marks,
          syllabusHeading: q.syllabusHeading ?? null,
          sourceTag: q.sourceTag ?? null,
        })),
      });
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          title: title.slice(0, 120),
          sourceLabel: packed.scopeLabel.slice(0, 180),
          sourceExcerpt: packed.excerpt.slice(0, 48_000),
          status: "READY",
          errorMessage: null,
        },
      });
    });
  } catch (err) {
    logger.error("quiz.generate.failed", { quizId, ...errorFields(err) });
    const message =
      err instanceof Error ? err.message : "Could not generate this quiz.";
    await prisma.quiz
      .update({
        where: { id: quizId },
        data: { status: "FAILED", errorMessage: message.slice(0, 400) },
      })
      .catch(() => undefined);
  } finally {
    generating.delete(quizId);
  }
}

export function scheduleQuizGeneration(quizId: string): void {
  void generateQuizPaper(quizId);
}
