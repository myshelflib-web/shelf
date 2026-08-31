import {
  completeChat,
  streamChat,
  isToolsUnsupportedMessage,
  type ChatMessage,
  type ChatToolCall,
} from "./llm.js";
import {
  executeStudyTool,
  STUDY_TOOLS,
  toolStatusDetail,
} from "./studyTools.js";
import type { StudyToolContext } from "./studyToolTypes.js";
import {
  mergeCitations,
  type LibraryCitation,
} from "../utils/ragPack.js";
import { logger, errorFields } from "../utils/logger.js";
import { logStudyAiEmptyReply } from "../utils/studyAiDiagnostics.js";
import { resolveApiKeyRouteForUserId } from "./apiKeyRoute.js";
import type { ApiKeyRoute } from "./apiKeyRoute.js";

export type StudyLlmOpts = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

function maxToolRounds(override?: number): number {
  return override ?? 3;
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
  return err instanceof Error && isToolsUnsupportedMessage(err.message);
}

async function runTools(
  calls: ChatToolCall[],
  ctx: StudyToolContext,
  citations: LibraryCitation[],
  onStatus?: (detail: string) => void
): Promise<{ messages: ChatMessage[]; citations: LibraryCitation[] }> {
  const out: ChatMessage[] = [];
  let nextCitations = citations;
  for (const call of calls) {
    onStatus?.(toolStatusDetail(call.function.name));
    const result = await executeStudyTool(
      call.function.name,
      call.function.arguments,
      ctx
    );
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

export type ToolChatResult = {
  text: string;
  tokens: number;
  citations: LibraryCitation[];
  model?: string;
};

function llmCallOpts(
  llmOpts: StudyLlmOpts | undefined,
  apiKeyRoute: ApiKeyRoute,
  extra?: {
    tools?: typeof STUDY_TOOLS;
    toolChoice?: "auto" | "none";
    signal?: AbortSignal;
    metricsFlow?: string;
  }
) {
  return {
    ...extra,
    model: llmOpts?.model,
    maxTokens: llmOpts?.maxTokens,
    temperature: llmOpts?.temperature,
    apiKeyRoute,
  };
}

/** Non-streaming chat with Study AI tools (planner, quiz, library, web). */
export async function completeWithStudyTools(
  messages: ChatMessage[],
  ctx: StudyToolContext,
  opts?: {
    citations?: LibraryCitation[];
    signal?: AbortSignal;
    enabled?: boolean;
    llm?: StudyLlmOpts;
    maxToolRounds?: number;
    metricsFlow?: string;
  }
): Promise<ToolChatResult> {
  const enabled = opts?.enabled !== false;
  let working = messages;
  let citations = opts?.citations ?? [];
  let tokens = 0;
  let useTools = enabled;
  const initial = messages;
  const rounds = maxToolRounds(opts?.maxToolRounds);
  const llmOpts = opts?.llm;
  const apiKeyRoute = await resolveApiKeyRouteForUserId(ctx.userId);

  for (let round = 0; round < rounds; round++) {
    if (opts?.signal?.aborted) break;
    try {
      const result = await completeChat(
        working,
        llmCallOpts(llmOpts, apiKeyRoute, {
          tools: useTools ? STUDY_TOOLS : undefined,
          toolChoice: useTools ? "auto" : "none",
          signal: opts?.signal,
          metricsFlow: opts?.metricsFlow ?? "study_tools",
        })
      );
      tokens += result.tokens;
      if (result.toolCalls?.length && useTools) {
        working = [
          ...working,
          {
            role: "assistant",
            content: result.text || null,
            tool_calls: result.toolCalls,
          },
        ];
        const ran = await runTools(result.toolCalls, ctx, citations);
        working = [...working, ...ran.messages];
        citations = ran.citations;
        continue;
      }
      return { text: result.text, tokens, citations };
    } catch (err) {
      if (useTools && toolsUnsupported(err)) {
        useTools = false;
        working = initial;
        continue;
      }
      throw err;
    }
  }

  const fallback = await completeChat(
    working,
    llmCallOpts(llmOpts, apiKeyRoute, {
      toolChoice: "none",
      signal: opts?.signal,
      metricsFlow: opts?.metricsFlow ?? "study_tools",
    })
  );
  return {
    text: fallback.text,
    tokens: tokens + fallback.tokens,
    citations,
  };
}

export type ToolStreamEvent =
  | { type: "status"; detail: string }
  | { type: "delta"; text: string }
  | {
      type: "done";
      answer: string;
      tokens: number;
      model: string;
      citations: LibraryCitation[];
    };

/** Streaming chat with Study AI tools. */
export async function* streamWithStudyTools(
  messages: ChatMessage[],
  ctx: StudyToolContext,
  opts?: {
    citations?: LibraryCitation[];
    signal?: AbortSignal;
    enabled?: boolean;
    llm?: StudyLlmOpts;
    maxToolRounds?: number;
    metricsFlow?: string;
  }
): AsyncGenerator<ToolStreamEvent> {
  const enabled = opts?.enabled !== false;
  let working = messages;
  let citations = opts?.citations ?? [];
  let tokens = 0;
  let model = "";
  let answer = "";
  let useTools = enabled;
  const initial = messages;
  const rounds = maxToolRounds(opts?.maxToolRounds);
  const llmOpts = opts?.llm;
  let toolCallsRun = 0;
  let fallbackError: unknown;
  const apiKeyRoute = await resolveApiKeyRouteForUserId(ctx.userId);

  for (let round = 0; round < rounds; round++) {
    if (opts?.signal?.aborted) break;

    let roundText = "";
    let toolCalls: ChatToolCall[] | undefined;
    try {
      for await (const ev of streamChat(
        working,
        llmCallOpts(llmOpts, apiKeyRoute, {
          tools: useTools ? STUDY_TOOLS : undefined,
          toolChoice: useTools ? "auto" : "none",
          signal: opts?.signal,
          metricsFlow: opts?.metricsFlow ?? "study_tools",
        })
      )) {
        if (opts?.signal?.aborted) break;
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
      if (opts?.signal?.aborted || (err as Error)?.name === "AbortError") break;
      if (useTools && toolsUnsupported(err)) {
        useTools = false;
        working = initial;
        answer = "";
        continue;
      }
      throw err;
    }

    if (toolCalls?.length && useTools && !roundText.trim()) {
      toolCallsRun += toolCalls.length;
      yield {
        type: "status",
        detail: toolStatusDetail(toolCalls[0].function.name),
      };
      working = [
        ...working,
        {
          role: "assistant",
          content: null,
          tool_calls: toolCalls,
        },
      ];
      const ran = await runTools(toolCalls, ctx, citations);
      for (const call of toolCalls.slice(1)) {
        yield { type: "status", detail: toolStatusDetail(call.function.name) };
      }
      working = [...working, ...ran.messages];
      citations = ran.citations;
      answer = "";
      continue;
    }

    answer = roundText;
    break;
  }

  if (!answer.trim() && !opts?.signal?.aborted) {
    yield { type: "status", detail: "Finishing answer…" };
    try {
      const fallback = await completeChat(
        working,
        llmCallOpts(llmOpts, apiKeyRoute, {
          toolChoice: "none",
          signal: opts?.signal,
        })
      );
      tokens += fallback.tokens;
      answer = fallback.text;
      if (answer) {
        yield { type: "delta", text: answer };
      }
    } catch (err) {
      fallbackError = err;
      logger.error("study.tools.stream.fallback_failed", {
        model: model || llmOpts?.model || null,
        toolsEnabled: enabled,
        toolCallsRun,
        ...errorFields(err),
      });
    }
  }

  if (!answer.trim()) {
    logStudyAiEmptyReply({
      channel: "tool_stream",
      reason: opts?.signal?.aborted
        ? "client_aborted"
        : fallbackError
          ? "synthesis_fallback_failed"
          : toolCallsRun > 0
            ? "tools_without_final_text"
            : "llm_returned_no_text",
      model: model || llmOpts?.model,
      tokens,
      toolsEnabled: enabled,
      aborted: Boolean(opts?.signal?.aborted),
      toolRounds: rounds,
      toolCallsRun,
      err: fallbackError,
    });
  }

  yield { type: "done", answer, tokens, model, citations };
}
