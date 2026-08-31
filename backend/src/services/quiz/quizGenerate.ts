import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { completeChat } from "../llm.js";
import { logger, errorFields } from "../../utils/logger.js";
import { quizFlow } from "../../utils/flowLog.js";
import {
  assertLlmRoom,
} from "../../utils/quotas.js";
import { assertLlmBudget, chargeLlmTokens } from "../../utils/llmUsage.js";
import { packQuizContext } from "./quizContext.js";
import { parseGeneratedQuiz } from "./quizParse.js";
import { userFacingQuizParseError } from "./quizJsonRepair.js";
import {
  quizJsonSchemaInstruction,
  quizSystemPrompt,
} from "./quizPrompt.js";
import { billedQuizTokens } from "./quizTokens.js";
import type { DraftQuestion } from "./quizLimits.js";
import type { ChatMessage, ChatResult } from "../llmTypes.js";
import { apiKeyRouteForUser } from "../apiKeyRoute.js";
import type { ApiKeyRoute } from "../apiKeyRoute.js";

const generating = new Set<string>();

async function chargeTokens(userId: string, tokens: number): Promise<void> {
  await chargeLlmTokens(userId, tokens);
}

export async function prepareQuizUser(userId: string) {
  await assertLlmBudget(userId, 1);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      studyGoal: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      llmTokensUsed: true,
    },
  });
  if (!user) throw new Error("User not found");
  return user;
}

function splitDrafts(questions: DraftQuestion[], mcqCount: number, writtenCount: number) {
  const mcq = questions.filter((q) => q.type === "MCQ").slice(0, mcqCount);
  const written = questions
    .filter((q) => q.type === "WRITTEN" || q.type === "IMAGE")
    .slice(0, writtenCount);
  return [...mcq, ...written];
}

function promptText(messages: ChatMessage[]): string {
  return messages
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n");
}

type QuizBill = {
  assertRoom: (prompt: string) => void;
  charge: (prompt: string, result: ChatResult) => Promise<void>;
};

async function callQuizModel(input: {
  system: string;
  excerpt: string;
  instruction: string;
  avoid?: string;
  bill: QuizBill;
  apiKeyRoute: ApiKeyRoute;
}): Promise<{ questions: DraftQuestion[]; title: string }> {
  const avoid = input.avoid
    ? `\nDo not repeat these stems or topics:\n${input.avoid}`
    : "";
  const material = input.excerpt.trim()
    ? input.excerpt
    : "(Little source text. Write Standard / Practice items strictly from the track syllabus. Mark gaps honestly in sourceTag Practice.)";

  const firstMessages: ChatMessage[] = [
    { role: "system", content: input.system },
    {
      role: "user",
      content: `${input.instruction}${avoid}\n\nSource material:\n${material}`,
    },
  ];
  const firstPrompt = promptText(firstMessages);
  input.bill.assertRoom(firstPrompt);
  const result = await completeChat(firstMessages, {
    maxTokens: 2048,
    temperature: 0.45,
    apiKeyRoute: input.apiKeyRoute,
  });
  await input.bill.charge(firstPrompt, result);
  try {
    return parseGeneratedQuiz(result.text);
  } catch (first) {
    const retryMessages: ChatMessage[] = [
      { role: "system", content: input.system },
      {
        role: "user",
        content: `${input.instruction}\n\nYour previous JSON was invalid (${
          first instanceof Error ? first.message.slice(0, 120) : "parse error"
        }). Reply with ONE valid JSON object only — double-quoted keys, no trailing commas, escape backslashes in LaTeX.\n\nSource material:\n${material}`,
      },
    ];
    const retryPrompt = promptText(retryMessages);
    input.bill.assertRoom(retryPrompt);
    const retry = await completeChat(retryMessages, {
      maxTokens: 2048,
      temperature: 0.15,
      apiKeyRoute: input.apiKeyRoute,
    });
    await input.bill.charge(retryPrompt, retry);
    return parseGeneratedQuiz(retry.text);
  }
}

export async function generateQuizPaper(quizId: string): Promise<void> {
  if (generating.has(quizId)) return;
  generating.add(quizId);
  try {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz || quiz.status === "GRADED" || quiz.status === "SUBMITTED") {
      return;
    }

    const user = await prepareQuizUser(quiz.userId);
    let used = user.llmTokensUsed;
    const bill: QuizBill = {
      assertRoom: () => {
        assertLlmRoom({ ...user, llmTokensUsed: used }, 1);
      },
      charge: async (prompt, result) => {
        const n = billedQuizTokens(result, prompt);
        await chargeTokens(quiz.userId, n);
        used += n;
      },
    };

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
    const apiKeyRoute = apiKeyRouteForUser(user);

    let title = quiz.title;
    let drafts: DraftQuestion[] = [];

    if (quiz.mcqCount > 0) {
      const mcq = await callQuizModel({
        system,
        excerpt: packed.excerpt,
        instruction: quizJsonSchemaInstruction(quiz.mcqCount, 0),
        bill,
        apiKeyRoute,
      });
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
        bill,
        apiKeyRoute,
      });
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
    quizFlow.generateOk(logger, {
      quizId,
      questionCount: drafts.length,
      sourceKind: quiz.sourceKind,
    });
  } catch (err) {
    quizFlow.generateFailed(logger, err, { quizId });
    logger.error("quiz.generate.failed", { quizId, ...errorFields(err) });
    const message = userFacingQuizParseError(err);
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
