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

const MAX_TOOL_ROUNDS = 3;

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

/** Non-streaming chat with Study AI tools (planner, quiz, library, web). */
export async function completeWithStudyTools(
  messages: ChatMessage[],
  ctx: StudyToolContext,
  opts?: {
    citations?: LibraryCitation[];
    signal?: AbortSignal;
    enabled?: boolean;
  }
): Promise<ToolChatResult> {
  const enabled = opts?.enabled !== false;
  let working = messages;
  let citations = opts?.citations ?? [];
  let tokens = 0;
  let useTools = enabled;
  const initial = messages;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (opts?.signal?.aborted) break;
    try {
      const result = await completeChat(working, {
        tools: useTools ? STUDY_TOOLS : undefined,
        toolChoice: useTools ? "auto" : "none",
        signal: opts?.signal,
      });
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

  const fallback = await completeChat(working, {
    toolChoice: "none",
    signal: opts?.signal,
  });
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

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (opts?.signal?.aborted) break;
    const lastRound = round === MAX_TOOL_ROUNDS - 1;

    let roundText = "";
    let toolCalls: ChatToolCall[] | undefined;
    try {
      for await (const ev of streamChat(working, {
        tools: useTools && !lastRound ? STUDY_TOOLS : undefined,
        toolChoice: useTools && !lastRound ? "auto" : "none",
        signal: opts?.signal,
      })) {
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

    if (toolCalls?.length && useTools && !lastRound && !roundText.trim()) {
      yield {
        type: "status",
        detail: toolStatusDetail(toolCalls[0].function.name),
      };
      working = [
        ...working,
        {
          role: "assistant",
          content: roundText.trim() ? roundText : null,
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

  yield { type: "done", answer, tokens, model, citations };
}
