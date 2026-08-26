import { StudyGoal } from "@prisma/client";
import {
  completeChat,
  streamChat,
  isToolsUnsupportedMessage,
  type ChatContentPart,
  type ChatMessage,
  type ChatToolCall,
} from "./llm.js";
import { studySystemPrompt } from "./goalPrompt.js";
import { retrieveLibrary } from "./ragRetrieve.js";
import { rewriteSearchQuery } from "../utils/queryRewrite.js";
import {
  compactHistory,
  mergeCitations,
  packLibraryExcerpts,
  type LibraryCitation,
} from "../utils/ragPack.js";
import {
  executeStudyTool,
  STUDY_TOOLS,
  toolStatusDetail,
} from "./studyTools.js";

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
};

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

const MAX_TOOL_ROUNDS = 3;

type PreparedRag = {
  messages: ChatMessage[];
  citations: LibraryCitation[];
  matchCount: number;
};

async function prepareRagAsk(opts: RagAskOpts): Promise<PreparedRag> {
  const searchQuery = rewriteSearchQuery(opts.query, opts.history);
  const excerpts = await retrieveLibrary(opts.userId, searchQuery, {
    pageIds: opts.pageIds,
  });
  const packed = packLibraryExcerpts(excerpts);
  const citations = packed.citations;

  const system = studySystemPrompt(opts.studyGoal, {
    syllabusText: opts.syllabusText,
    scopeLabel: opts.scopeLabel,
    withTools: true,
  });
  const userPrompt =
    excerpts.length === 0
      ? `The library search returned no excerpts.\nQuestion: ${opts.query}`
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
  };
}

function toolsUnsupported(err: unknown): boolean {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "thought_signature"
  ) {
    return true;
  }
  return (
    err instanceof Error && isToolsUnsupportedMessage(err.message)
  );
}

async function runTools(
  calls: ChatToolCall[],
  opts: RagAskOpts,
  citations: LibraryCitation[],
  onStatus?: (detail: string) => void
): Promise<{
  messages: ChatMessage[];
  citations: LibraryCitation[];
}> {
  const out: ChatMessage[] = [];
  let nextCitations = citations;
  for (const call of calls) {
    onStatus?.(toolStatusDetail(call.function.name));
    const result = await executeStudyTool(call.function.name, call.function.arguments, {
      userId: opts.userId,
      pageIds: opts.pageIds,
    });
    if (result.citations?.length) {
      nextCitations = mergeCitations(nextCitations, result.citations);
    }
    out.push({
      role: "tool",
      tool_call_id: call.id,
      name: call.function.name,
      content: result.text,
    });
  }
  return { messages: out, citations: nextCitations };
}

export async function answerWithRag(opts: RagAskOpts): Promise<RagResult> {
  const prepared = await prepareRagAsk(opts);
  let messages = prepared.messages;
  let citations = prepared.citations;
  let tokens = 0;
  let useTools = true;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (opts.signal?.aborted) break;
    try {
      const result = await completeChat(messages, {
        tools: useTools ? STUDY_TOOLS : undefined,
        toolChoice: useTools ? "auto" : "none",
        signal: opts.signal,
      });
      tokens += result.tokens;
      if (result.toolCalls?.length && useTools) {
        messages = [
          ...messages,
          {
            role: "assistant",
            content: result.text || null,
            tool_calls: result.toolCalls,
          },
        ];
        const ran = await runTools(result.toolCalls, opts, citations);
        messages = [...messages, ...ran.messages];
        citations = ran.citations;
        continue;
      }
      return {
        answer: result.text,
        citations,
        matchCount: citations.length,
        tokens,
      };
    } catch (err) {
      if (useTools && toolsUnsupported(err)) {
        useTools = false;
        // Drop any partial tool turn — Gemini rejects history without signatures.
        messages = prepared.messages;
        continue;
      }
      throw err;
    }
  }

  const fallback = await completeChat(messages, {
    toolChoice: "none",
    signal: opts.signal,
  });
  return {
    answer: fallback.text,
    citations,
    matchCount: citations.length,
    tokens: tokens + fallback.tokens,
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

  let messages = prepared.messages;
  let citations = prepared.citations;
  let tokens = 0;
  let model = "";
  let answer = "";
  let useTools = true;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (opts.signal?.aborted) break;
    const lastRound = round === MAX_TOOL_ROUNDS - 1;
    yield {
      type: "status",
      stage: "generating",
      detail: round === 0 ? "Writing answer…" : "Continuing…",
    };

    let roundText = "";
    let toolCalls: ChatToolCall[] | undefined;
    try {
      for await (const ev of streamChat(messages, {
        tools: useTools && !lastRound ? STUDY_TOOLS : undefined,
        toolChoice: useTools && !lastRound ? "auto" : "none",
        signal: opts.signal,
      })) {
        if (opts.signal?.aborted) break;
        if (ev.type === "delta") {
          if (toolCalls?.length) continue;
          roundText += ev.text;
          answer = roundText;
          yield { type: "delta", text: ev.text };
        } else if (ev.type === "tool_calls") {
          toolCalls = ev.calls;
        } else {
          tokens += ev.tokens;
          model = ev.model;
        }
      }
    } catch (err) {
      if (opts.signal?.aborted || (err as Error)?.name === "AbortError") break;
      if (useTools && toolsUnsupported(err)) {
        useTools = false;
        messages = prepared.messages;
        answer = "";
        continue;
      }
      throw err;
    }

    if (toolCalls?.length && useTools && !lastRound && !roundText.trim()) {
      yield {
        type: "status",
        stage: "tools",
        detail: toolStatusDetail(toolCalls[0].function.name),
      };
      messages = [
        ...messages,
        {
          role: "assistant",
          content: roundText.trim() ? roundText : null,
          tool_calls: toolCalls,
        },
      ];
      const ran = await runTools(toolCalls, opts, citations, (detail) => {
        /* status yielded above; extra tools reuse generating */
        void detail;
      });
      for (const call of toolCalls.slice(1)) {
        yield {
          type: "status",
          stage: "tools",
          detail: toolStatusDetail(call.function.name),
        };
      }
      messages = [...messages, ...ran.messages];
      citations = ran.citations;
      answer = "";
      continue;
    }

    answer = roundText;
    break;
  }

  yield {
    type: "done",
    answer,
    citations,
    matchCount: citations.length,
    tokens,
    model,
  };
}
