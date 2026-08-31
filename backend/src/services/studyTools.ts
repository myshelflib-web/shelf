import type { ChatToolDef } from "./llmTypes.js";
import prisma from "../utils/prisma.js";
import { pageHref } from "../utils/docPaths.js";
import { truncateText } from "../utils/htmlText.js";
import { rangedTaskWhere, mergeRangedTasks } from "../utils/plannerTasks.js";
import { extractPageBody } from "./libraryIndex.js";
import { retrieveLibrary, type Excerpt } from "./ragRetrieve.js";
import { packLibraryExcerpts } from "../utils/ragPack.js";
import { webLookup } from "./webLookup.js";
import { parseWebSourceScope } from "./webSourceProfiles.js";
import {
  currentTimeLookup,
  fetchPublicUrl,
  lookupCollection,
  lookupHighlights,
  lookupRecentPages,
  lookupRelevancy,
  lookupStarred,
} from "./studyLookups.js";
import {
  STUDY_ACTION_TOOLS,
  actionToolStatusDetail,
  executeStudyActionTool,
} from "./studyActionTools.js";
import type { StudyToolContext, StudyToolResult } from "./studyToolTypes.js";

export type { StudyToolContext, StudyToolResult };

const STUDY_LOOKUP_TOOLS: ChatToolDef[] = [
  {
    type: "function",
    function: {
      name: "library_search",
      description:
        "Search the learner's Shelf library (PDFs and notes) by meaning and keywords. Use for course content, definitions, and quotes from their files.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Standalone search query (no pronouns).",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_page",
      description:
        "Fetch more text from one library page. Prefer pageId from excerpts when you have it; otherwise match by title.",
      parameters: {
        type: "object",
        properties: {
          pageId: { type: "string", description: "Page UUID if known." },
          title: { type: "string", description: "Page title to match." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_library",
      description:
        "List collections, topics, and recent page titles in the learner's library (app lookup).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_planner",
      description:
        "Look up upcoming planner tasks and events for the next two weeks, plus unscheduled items.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search Google and other public web sources. Use only when the library does not cover the question.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_highlights",
      description:
        "Search the learner's highlights and highlight notes. Optional query filters the quote or note.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional text to match in highlight or note.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_recent_pages",
      description:
        "List pages the learner opened or updated most recently (app lookup).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_starred",
      description: "List pages the learner starred in the library.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_collection",
      description:
        "List topics and page titles inside one collection (notebook) by name.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Collection name to match." },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_relevancy",
      description:
        "Read saved syllabus / relevancy docs (exam outline the learner attached).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Optional title or body filter.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Fetch readable text from a public http(s) page after web_search. Do not fetch private or login URLs.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "Public https URL." },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "current_time",
      description:
        "Current UTC date/time. Use before answering relative planner questions (today, tomorrow).",
      parameters: { type: "object", properties: {} },
    },
  },
];

export const STUDY_TOOLS: ChatToolDef[] = [
  ...STUDY_LOOKUP_TOOLS,
  ...STUDY_ACTION_TOOLS,
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

async function lookupPage(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const pageId = String(args.pageId ?? "").trim();
  const title = String(args.title ?? "").trim();
  if (pageId && ctx.pageIds && !ctx.pageIds.includes(pageId)) {
    return { text: "That page is outside this chat's library scope." };
  }
  const page = pageId
    ? await prisma.userTopic.findFirst({
        where: {
          id: pageId,
          userId: ctx.userId,
        },
        include: {
          userSubject: { select: { name: true, slug: true } },
          userTopicGroup: { select: { title: true, slug: true } },
        },
      })
    : title
      ? await prisma.userTopic.findFirst({
          where: {
            userId: ctx.userId,
            status: "PUBLISHED",
            title: { contains: title, mode: "insensitive" },
            ...(ctx.pageIds ? { id: { in: ctx.pageIds } } : {}),
          },
          include: {
            userSubject: { select: { name: true, slug: true } },
            userTopicGroup: { select: { title: true, slug: true } },
          },
        })
      : null;
  if (!page) {
    return { text: "No matching page in this library scope." };
  }
  const body = await extractPageBody(page);
  const notebook = page.userSubject?.name ?? "Library";
  const topic = page.userTopicGroup?.title ?? "";
  const href = pageHref(
    page.userSubject?.slug,
    page.userTopicGroup?.slug,
    page.slug
  );
  const text = truncateText(body, 3_500);
  const excerpt: Excerpt = {
    pageId: page.id,
    title: page.title,
    notebook,
    topic,
    href,
    text,
    score: 1,
  };
  const packed = packLibraryExcerpts([excerpt]);
  return {
    text: `Page: ${page.title} (${notebook}${topic ? ` / ${topic}` : ""})\nid: ${page.id}\n${text}`,
    excerpts: [excerpt],
    citations: packed.citations,
  };
}

async function listLibrary(ctx: StudyToolContext): Promise<StudyToolResult> {
  const notebooks = await prisma.userSubject.findMany({
    where: { userId: ctx.userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      name: true,
      topicGroups: {
        orderBy: { order: "asc" },
        take: 8,
        select: {
          title: true,
          pages: {
            where: { status: "PUBLISHED" },
            orderBy: { updatedAt: "desc" },
            take: 6,
            select: { title: true },
          },
        },
      },
      topics: {
        where: { userTopicGroupId: null, status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { title: true },
      },
    },
  });
  const rootPages = await prisma.userTopic.findMany({
    where: { userId: ctx.userId, userSubjectId: null, status: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { title: true },
  });
  if (notebooks.length === 0 && rootPages.length === 0) {
    return { text: "The library is empty." };
  }
  const lines: string[] = [];
  if (rootPages.length) {
    lines.push(
      `Library root pages: ${rootPages.map((p) => p.title).join("; ")}`
    );
  }
  for (const nb of notebooks) {
    const topicBits = nb.topicGroups.map((g) => {
      const pages = g.pages.map((p) => p.title).join(", ");
      return pages ? `${g.title} [${pages}]` : g.title;
    });
    const loose = nb.topics.map((p) => p.title);
    lines.push(
      `${nb.name}: ${[...topicBits, ...loose].filter(Boolean).join(" · ") || "(empty)"}`
    );
  }
  return { text: truncateText(lines.join("\n"), 3_000) };
}

async function lookupPlanner(ctx: StudyToolContext): Promise<StudyToolResult> {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 14);
  const rows = await prisma.studyTask.findMany({
    where: { userId: ctx.userId, AND: [rangedTaskWhere(from, to)] },
    orderBy: { dueAt: "asc" },
    take: 40,
    select: {
      id: true,
      title: true,
      kind: true,
      dueAt: true,
      completed: true,
      href: true,
      notes: true,
      recurrence: true,
      recurUntil: true,
      endsAt: true,
    },
  });
  const items = mergeRangedTasks(rows, from, to).slice(0, 16);
  if (items.length === 0) {
    return { text: "No upcoming planner items in the next two weeks." };
  }
  const lines = items.map((t) => {
    const when = t.dueAt ? t.dueAt.toISOString().slice(0, 10) : "unscheduled";
    const done = t.completed ? "done" : "open";
    return `- [${t.kind}] ${t.title} (${when}, ${done})${t.href ? ` → ${t.href}` : ""}`;
  });
  return { text: lines.join("\n") };
}

export async function executeStudyTool(
  name: string,
  rawArgs: string,
  ctx: StudyToolContext
): Promise<StudyToolResult> {
  const args = parseArgs(rawArgs);
  if (name === "library_search") {
    const query = String(args.query ?? "").trim();
    if (!query) return { text: "library_search needs a query." };
    const excerpts = await retrieveLibrary(ctx.userId, query, {
      pageIds: ctx.pageIds,
    });
    if (excerpts.length === 0) {
      return { text: "No matching library pages for that query." };
    }
    const packed = packLibraryExcerpts(excerpts);
    return {
      text: packed.numbered || "No excerpts.",
      excerpts,
      citations: packed.citations,
    };
  }
  if (name === "lookup_page") return lookupPage(ctx, args);
  if (name === "list_library") return listLibrary(ctx);
  if (name === "lookup_planner") return lookupPlanner(ctx);
  if (name === "web_search") {
    if (ctx.webSearch === false) {
      return {
        text: "Web search is off for this question. Answer from the open file, library tools, and your knowledge.",
      };
    }
    const query = String(args.query ?? "").trim();
    const sourceScope = parseWebSourceScope(args.sourceScope);
    return {
      text: await webLookup(query, {
        timeoutMs: 5_000,
        studyGoal: ctx.studyGoal,
        sourceScope,
      }),
    };
  }
  if (name === "lookup_highlights") return lookupHighlights(ctx, args);
  if (name === "lookup_recent_pages") return lookupRecentPages(ctx);
  if (name === "lookup_starred") return lookupStarred(ctx);
  if (name === "lookup_collection") return lookupCollection(ctx, args);
  if (name === "lookup_relevancy") return lookupRelevancy(ctx, args);
  if (name === "fetch_url") {
    if (ctx.webSearch === false) {
      return {
        text: "Web fetch is off for this question. Answer without opening external URLs.",
      };
    }
    return fetchPublicUrl(args);
  }
  if (name === "current_time") return currentTimeLookup();
  const action = await executeStudyActionTool(name, rawArgs, ctx);
  if (action) return action;
  return { text: `Unknown tool: ${name}` };
}

export function toolStatusDetail(name: string): string {
  const action = actionToolStatusDetail(name);
  if (action) return action;
  switch (name) {
    case "library_search":
      return "Searching your library…";
    case "lookup_page":
      return "Opening a page…";
    case "list_library":
      return "Browsing collections…";
    case "lookup_planner":
      return "Checking your planner…";
    case "web_search":
      return "Searching Google…";
    case "lookup_highlights":
      return "Reading your highlights…";
    case "lookup_recent_pages":
      return "Checking recent pages…";
    case "lookup_starred":
      return "Opening starred pages…";
    case "lookup_collection":
      return "Opening a collection…";
    case "lookup_relevancy":
      return "Reading your syllabus…";
    case "fetch_url":
      return "Fetching a web page…";
    case "current_time":
      return "Checking the date…";
    default:
      return "Using a tool…";
  }
}
