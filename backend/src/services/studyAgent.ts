import { StudyGoal } from "@prisma/client";
import {
  type ChatContentPart,
  type ChatMessage,
} from "./llm.js";
import { studySystemPrompt } from "./goalPrompt.js";
import { retrieveLibrary } from "./ragRetrieve.js";
import { rewriteSearchQuery } from "../utils/queryRewrite.js";
import {
  compactHistory,
  packLibraryExcerpts,
  type LibraryCitation,
} from "../utils/ragPack.js";
import {
  completeWithStudyTools,
  streamWithStudyTools,
  type StudyLlmOpts,
} from "./studyToolLoop.js";
import { studyToolsForRequest } from "./studyToolFilter.js";
import { parseStudyDepth, studyDepthConfig } from "./studyDepth.js";
import { logger } from "../utils/logger.js";
import { studyFlow } from "../utils/flowLog.js";

export type { LibraryCitation };

export type RagResult = {
  answer: string;
  citations: LibraryCitation[];
  matchCount: number;
  tokens: number;
};

export type RagHistoryMessage = {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
};

export type RagAskOpts = {
  userId: string;
  query: string;
  studyGoal: StudyGoal;
  history?: RagHistoryMessage[];
  imageBase64?: string;
  historyLimit?: number;
  pageIds?: string[] | null;
  scopeLabel?: string | null;
  syllabusText?: string | null;
  signal?: AbortSignal;
  defaultPageId?: string | null;
  depth?: string;
  /** False for slash commands (/flashcards, /pyq) that need markdown, not tools. */
  toolsEnabled?: boolean;
  /** When false, omit web_search and fetch_url (reader PDF toggle). Default true. */
  webSearch?: boolean;
  /** Grafana flow label (default study_chat). */
  metricsFlow?: string;
};

/** Slash bubbles use /cmd labels — answer in text, not via tool calls. */
export function ragToolsEnabled(bubbleContent: string): boolean {
  return !bubbleContent.trim().startsWith("/");
}

export type RagStreamEvent =
  | { type: "status"; stage: string; detail: string; citations?: LibraryCitation[] }
  | { type: "delta"; text: string }
  | {
      type: "done";
      answer: string;
      citations: LibraryCitation[];
      matchCount: number;
      tokens: number;
      model: string;
    };

type PreparedRag = {
  messages: ChatMessage[];
  citations: LibraryCitation[];
  matchCount: number;
  llm: StudyLlmOpts;
  maxToolRounds: number;
  toolsEnabled: boolean;
  tools: ReturnType<typeof studyToolsForRequest>;
};

async function prepareRagAsk(opts: RagAskOpts): Promise<PreparedRag> {
  const depth = parseStudyDepth(opts.depth);
  const depthCfg = studyDepthConfig(depth);
  const toolsEnabled = opts.toolsEnabled !== false;
  const webSearch = opts.webSearch !== false;
  const tools = studyToolsForRequest({ webSearch, studyGoal: opts.studyGoal });
  const searchQuery = rewriteSearchQuery(opts.query, opts.history);
  const excerpts = await retrieveLibrary(opts.userId, searchQuery, {
    pageIds: opts.pageIds,
  });
  const packed = packLibraryExcerpts(excerpts, depthCfg.libraryContextBudget);
  const citations = packed.citations;

  const system = studySystemPrompt(opts.studyGoal, {
    syllabusText: opts.syllabusText,
    scopeLabel: opts.scopeLabel,
    withTools: toolsEnabled,
    depth,
  });
  const userPrompt =
    excerpts.length === 0
      ? `The library search returned no excerpts.\nQuestion: ${opts.query}\nAnswer helpfully from general knowledge and tools (planner, quiz, web) when useful — do not refuse solely because the library is empty.`
      : `Question: ${opts.query}\n\nLibrary excerpts:\n${packed.numbered}`;

  const historyLimit = opts.historyLimit ?? 16;
  const historyMsgs: ChatMessage[] = compactHistory(
    opts.history ?? [],
    historyLimit
  ).map((m) => {
    if (m.role === "user" && m.imageBase64?.startsWith("data:image/")) {
      const parts: ChatContentPart[] = [
        { type: "text", text: m.content },
        { type: "image_url", image_url: { url: m.imageBase64 } },
      ];
      return { role: "user" as const, content: parts };
    }
    return { role: m.role, content: m.content };
  });

  const latestParts: ChatContentPart[] = [{ type: "text", text: userPrompt }];
  if (opts.imageBase64?.startsWith("data:image/")) {
    latestParts.push({
      type: "image_url",
      image_url: { url: opts.imageBase64 },
    });
  }

  return {
    messages: [
      { role: "system", content: system },
      ...historyMsgs,
      {
        role: "user",
        content: latestParts.length > 1 ? latestParts : userPrompt,
      },
    ],
    citations,
    matchCount: excerpts.length,
    llm: {
      model: depthCfg.model,
      maxTokens: depthCfg.maxTokens,
      temperature: depthCfg.temperature,
    },
    maxToolRounds: depthCfg.toolRounds,
    toolsEnabled,
    tools,
  };
}

function toolCtx(opts: RagAskOpts) {
  return {
    userId: opts.userId,
    pageIds: opts.pageIds,
    defaultPageId: opts.defaultPageId ?? null,
    webSearch: opts.webSearch !== false,
    studyGoal: opts.studyGoal,
  };
}

export async function answerWithRag(opts: RagAskOpts): Promise<RagResult> {
  studyFlow.ragStart(logger, {
    userId: opts.userId,
    scopeLabel: opts.scopeLabel ?? null,
  });
  const prepared = await prepareRagAsk(opts);
  const result = await completeWithStudyTools(prepared.messages, toolCtx(opts), {
    citations: prepared.citations,
    signal: opts.signal,
    enabled: prepared.toolsEnabled,
    tools: prepared.tools,
    llm: prepared.llm,
    maxToolRounds: prepared.maxToolRounds,
    metricsFlow: opts.metricsFlow ?? "study_chat",
  });
  studyFlow.ragOk(logger, {
    userId: opts.userId,
    matchCount: result.citations.length,
    tokens: result.tokens,
  });
  return {
    answer: result.text,
    citations: result.citations,
    matchCount: result.citations.length,
    tokens: result.tokens,
  };
}

export async function* streamAnswerWithRag(
  opts: RagAskOpts
): AsyncGenerator<RagStreamEvent> {
  const searchDetail = opts.scopeLabel?.trim()
    ? `Searching in ${opts.scopeLabel.trim()}…`
    : "Searching your collections…";
  yield { type: "status", stage: "searching", detail: searchDetail };
  const prepared = await prepareRagAsk(opts);
  const scopeHint = opts.scopeLabel?.trim();
  yield {
    type: "status",
    stage: "retrieved",
    detail:
      prepared.matchCount > 0
        ? `Found ${prepared.matchCount} page${prepared.matchCount === 1 ? "" : "s"}${scopeHint ? ` in ${scopeHint}` : " in your library"}`
        : scopeHint
          ? `No matching pages in ${scopeHint}`
          : "No matching pages — answering from your study goal",
    citations: prepared.citations,
  };

  yield {
    type: "status",
    stage: "generating",
    detail: "Writing answer…",
  };

  for await (const ev of streamWithStudyTools(
    prepared.messages,
    toolCtx(opts),
    {
      citations: prepared.citations,
      signal: opts.signal,
      enabled: prepared.toolsEnabled,
      tools: prepared.tools,
      llm: prepared.llm,
      maxToolRounds: prepared.maxToolRounds,
      metricsFlow: opts.metricsFlow ?? "study_chat",
    }
  )) {
    if (ev.type === "status") {
      yield { type: "status", stage: "tools", detail: ev.detail };
    } else if (ev.type === "delta") {
      yield { type: "delta", text: ev.text };
    } else {
      yield {
        type: "done",
        answer: ev.answer,
        citations: ev.citations,
        matchCount: ev.citations.length,
        tokens: ev.tokens,
        model: ev.model,
      };
    }
  }
}
