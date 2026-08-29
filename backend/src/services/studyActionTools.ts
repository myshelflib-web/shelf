import { StudyItemKind } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { masterId, parseRecurrence } from "../utils/recurrence.js";
import {
  assertChatContextOwned,
  type ChatContextKind,
} from "../utils/chatContext.js";
import { QuotaError } from "../utils/quotas.js";
import type { ChatToolDef } from "./llmTypes.js";
import type { StudyToolContext, StudyToolResult } from "./studyToolTypes.js";
import {
  clampFocus,
  clampQuestionCounts,
  parseDifficulty,
  parseProctored,
  parseSourceKind,
  parseTimeLimitSec,
} from "./quiz/quizLimits.js";
import {
  prepareQuizUser,
  scheduleQuizGeneration,
} from "./quiz/quizGenerate.js";

/** Mutating tools: planner write + quiz create. Keep separate from read lookups. */
export const STUDY_ACTION_TOOLS: ChatToolDef[] = [
  {
    type: "function",
    function: {
      name: "create_planner_item",
      description:
        "Create a planner task (reminder/study to-do) or calendar event. Use for add task, remind me, schedule study. Call current_time first for relative dates.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short item title." },
          kind: {
            type: "string",
            description: "TASK (default, reminder/to-do) or EVENT.",
            enum: ["TASK", "EVENT"],
          },
          dueAt: {
            type: "string",
            description:
              "ISO date/time for when it is due. Omit for unscheduled / To plan.",
          },
          endsAt: {
            type: "string",
            description: "Optional ISO end time (events).",
          },
          notes: { type: "string", description: "Optional notes." },
          href: {
            type: "string",
            description:
              "TASK: optional /my-content/... path. EVENT: optional https URL.",
          },
          recurrence: {
            type: "string",
            description: "EVENT only: NONE, DAILY, WEEKLY, or MONTHLY.",
            enum: ["NONE", "DAILY", "WEEKLY", "MONTHLY"],
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_planner_item",
      description:
        "Update or complete a planner item. Use lookup_planner first if you need the id.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Task id (master uuid; strip ::date suffix if present).",
          },
          title: { type: "string" },
          notes: { type: "string" },
          dueAt: {
            type: "string",
            description: "ISO due date, or empty string to clear (unscheduled).",
          },
          completed: {
            type: "boolean",
            description: "Set true to mark a task done.",
          },
          href: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_quiz",
      description:
        "Start generating a Shelf quiz from the library (or exam bank). Returns a /quiz/:id link; generation continues in the background.",
      parameters: {
        type: "object",
        properties: {
          focusTopic: {
            type: "string",
            description: "Optional topic focus for the paper.",
          },
          difficulty: {
            type: "string",
            enum: ["EASY", "MEDIUM", "HARD", "EXAM"],
          },
          mcqCount: { type: "number", description: "MCQ count (0–20, default 5)." },
          writtenCount: {
            type: "number",
            description: "Written count (0–8, default 2).",
          },
          timeLimitSec: {
            type: "number",
            description: "Optional timer in seconds.",
          },
          proctored: {
            type: "boolean",
            description:
              "True (default) for fullscreen exam sitting; false for practice with tab switches allowed.",
          },
          sourceKind: {
            type: "string",
            enum: ["LIBRARY", "EXAM_BANK"],
            description: "LIBRARY (default) or EXAM_BANK.",
          },
          contextKind: {
            type: "string",
            enum: ["LIBRARY", "NOTEBOOK", "TOPIC", "PAGE"],
            description:
              "Scope. Default PAGE when chatting on a document, else LIBRARY.",
          },
          contextPageId: { type: "string" },
          contextNotebookId: { type: "string" },
          contextTopicId: { type: "string" },
        },
      },
    },
  },
];

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}") as unknown;
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseKind(value: unknown): StudyItemKind {
  return value === "EVENT" ? StudyItemKind.EVENT : StudyItemKind.TASK;
}

function parseOptionalDate(raw: unknown): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const d = new Date(String(raw));
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

async function createPlannerItem(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const title = String(args.title ?? "").trim();
  if (!title) return { text: "create_planner_item needs a title." };

  const kind = parseKind(args.kind);
  const due = parseOptionalDate(args.dueAt);
  if (args.dueAt !== undefined && args.dueAt !== null && args.dueAt !== "" && due === undefined) {
    return { text: "Invalid dueAt — use an ISO date/time." };
  }
  const ends = parseOptionalDate(args.endsAt);
  if (args.endsAt && ends === undefined) {
    return { text: "Invalid endsAt — use an ISO date/time." };
  }

  const rec =
    kind === StudyItemKind.EVENT ? parseRecurrence(args.recurrence) : "NONE";
  if (rec !== "NONE" && !due) {
    return { text: "Recurring events require dueAt." };
  }

  let href = String(args.href ?? "").trim() || null;
  if (kind === StudyItemKind.TASK && href && !href.startsWith("/")) {
    href = null;
  }
  if (kind === StudyItemKind.EVENT && href && !/^https:\/\//i.test(href)) {
    href = null;
  }

  const task = await prisma.studyTask.create({
    data: {
      userId: ctx.userId,
      title,
      notes: String(args.notes ?? "").trim() || null,
      kind,
      dueAt: due ?? null,
      endsAt: ends ?? null,
      href,
      recurrence: rec,
    },
    select: {
      id: true,
      title: true,
      kind: true,
      dueAt: true,
      completed: true,
      href: true,
    },
  });

  const when = task.dueAt ? task.dueAt.toISOString() : "unscheduled (To plan)";
  return {
    text: `Created ${task.kind} "${task.title}" (id: ${task.id}, due: ${when}). Open /planner to review.`,
  };
}

async function updatePlannerItem(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const id = masterId(String(args.id ?? "").trim());
  if (!id) return { text: "update_planner_item needs an id." };

  const existing = await prisma.studyTask.findFirst({
    where: { id, userId: ctx.userId },
  });
  if (!existing) return { text: "Planner item not found." };

  const data: {
    title?: string;
    notes?: string | null;
    dueAt?: Date | null;
    completed?: boolean;
    href?: string | null;
  } = {};

  if (args.title !== undefined) {
    const t = String(args.title).trim();
    if (t) data.title = t;
  }
  if (args.notes !== undefined) {
    data.notes = String(args.notes).trim() || null;
  }
  if (args.dueAt !== undefined) {
    const due = parseOptionalDate(args.dueAt);
    if (args.dueAt !== null && args.dueAt !== "" && due === undefined) {
      return { text: "Invalid dueAt — use an ISO date/time or empty to clear." };
    }
    data.dueAt = due ?? null;
  }
  if (typeof args.completed === "boolean") {
    data.completed = args.completed;
  }
  if (args.href !== undefined) {
    data.href = String(args.href).trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return { text: "Nothing to update — pass title, notes, dueAt, completed, or href." };
  }

  const task = await prisma.studyTask.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      kind: true,
      dueAt: true,
      completed: true,
    },
  });

  const when = task.dueAt ? task.dueAt.toISOString() : "unscheduled";
  const done = task.completed ? "done" : "open";
  return {
    text: `Updated ${task.kind} "${task.title}" (id: ${task.id}, ${when}, ${done}).`,
  };
}

function parseContextKind(raw: unknown): ChatContextKind {
  const v = String(raw ?? "").toUpperCase();
  if (v === "NOTEBOOK" || v === "TOPIC" || v === "PAGE" || v === "LIBRARY") {
    return v as ChatContextKind;
  }
  return "LIBRARY";
}

async function createQuiz(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const sourceKind = parseSourceKind(args.sourceKind ?? "LIBRARY");
  if (sourceKind === "UPLOAD") {
    return {
      text: "create_quiz cannot use UPLOAD from chat — use LIBRARY or EXAM_BANK, or open /quiz to upload notes.",
    };
  }

  const difficulty = parseDifficulty(args.difficulty ?? "MEDIUM");
  const { mcqCount, writtenCount } = clampQuestionCounts(
    args.mcqCount === undefined ? 5 : Number(args.mcqCount),
    args.writtenCount === undefined ? 2 : Number(args.writtenCount)
  );
  const timeLimitSec = parseTimeLimitSec(args.timeLimitSec);
  const proctored = parseProctored(args.proctored);
  const focusTopic = clampFocus(args.focusTopic);

  let contextKind = parseContextKind(args.contextKind);
  let contextPageId = String(args.contextPageId ?? "").trim() || null;
  let contextNotebookId = String(args.contextNotebookId ?? "").trim() || null;
  let contextTopicId = String(args.contextTopicId ?? "").trim() || null;

  if (!args.contextKind && ctx.defaultPageId) {
    contextKind = "PAGE";
    contextPageId = ctx.defaultPageId;
  }

  if (contextKind === "LIBRARY") {
    contextNotebookId = null;
    contextTopicId = null;
    contextPageId = null;
  } else if (contextKind === "PAGE" && !contextPageId) {
    return { text: "PAGE scope needs contextPageId (or open a document first)." };
  }

  try {
    await assertChatContextOwned(ctx.userId, {
      contextKind,
      contextNotebookId,
      contextTopicId,
      contextPageId,
    });
  } catch (err) {
    return {
      text: err instanceof Error ? err.message : "Invalid library scope for quiz.",
    };
  }

  try {
    await prepareQuizUser(ctx.userId);
  } catch (err) {
    if (err instanceof QuotaError) {
      return { text: err.message };
    }
    throw err;
  }

  const quiz = await prisma.quiz.create({
    data: {
      userId: ctx.userId,
      title: "Generating quiz…",
      sourceKind,
      contextKind,
      contextNotebookId: contextKind === "LIBRARY" ? null : contextNotebookId,
      contextTopicId: contextKind === "TOPIC" ? contextTopicId : null,
      contextPageId: contextKind === "PAGE" ? contextPageId : null,
      focusTopic,
      difficulty,
      timeLimitSec,
      mcqCount,
      writtenCount,
      proctored,
      status: "GENERATING",
    },
    select: { id: true },
  });

  scheduleQuizGeneration(quiz.id);
  return {
    text: `Quiz started (id: ${quiz.id}). Open /quiz/${quiz.id} — questions generate in the background. Tell the learner the link.`,
  };
}

export async function executeStudyActionTool(
  name: string,
  rawArgs: string,
  ctx: StudyToolContext
): Promise<StudyToolResult | null> {
  const args = parseArgs(rawArgs);
  if (name === "create_planner_item") return createPlannerItem(ctx, args);
  if (name === "update_planner_item") return updatePlannerItem(ctx, args);
  if (name === "create_quiz") return createQuiz(ctx, args);
  return null;
}

export function actionToolStatusDetail(name: string): string | null {
  switch (name) {
    case "create_planner_item":
      return "Adding to your planner…";
    case "update_planner_item":
      return "Updating your planner…";
    case "create_quiz":
      return "Starting a quiz…";
    default:
      return null;
  }
}
