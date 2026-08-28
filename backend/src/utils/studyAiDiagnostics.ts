import { logger, errorFields } from "./logger.js";

export type StudyAiEmptyChannel =
  | "page_ask_stream"
  | "chat_stream"
  | "tool_stream"
  | "map_reduce_stream";

export type StudyAiEmptyReplyContext = {
  channel: StudyAiEmptyChannel;
  reason: string;
  userId?: string;
  mode?: string;
  depth?: string;
  model?: string;
  tokens?: number;
  toolsEnabled?: boolean;
  aborted?: boolean;
  usedVectors?: boolean;
  contextChars?: number;
  mapReduce?: boolean;
  clientGone?: boolean;
  toolRounds?: number;
  toolCallsRun?: number;
  err?: unknown;
};

/** Structured log when Study AI finishes with no user-visible text. */
export function logStudyAiEmptyReply(ctx: StudyAiEmptyReplyContext): void {
  logger.error("study.ai.empty_reply", {
    channel: ctx.channel,
    reason: ctx.reason,
    userId: ctx.userId ?? null,
    mode: ctx.mode ?? null,
    depth: ctx.depth ?? null,
    model: ctx.model || null,
    tokens: ctx.tokens ?? 0,
    toolsEnabled: ctx.toolsEnabled ?? null,
    aborted: Boolean(ctx.aborted),
    usedVectors: ctx.usedVectors ?? null,
    contextChars: ctx.contextChars ?? null,
    mapReduce: ctx.mapReduce ?? null,
    clientGone: ctx.clientGone ?? null,
    toolRounds: ctx.toolRounds ?? null,
    toolCallsRun: ctx.toolCallsRun ?? null,
    ...(ctx.err ? errorFields(ctx.err) : {}),
  });
}

export function logStudyAiStreamFailure(
  channel: StudyAiEmptyChannel,
  err: unknown,
  fields?: Record<string, unknown>
): void {
  logger.error("study.ai.stream_failed", {
    channel,
    ...fields,
    ...errorFields(err),
  });
}

/** Only abort in-flight LLM work when the client drops before the response ends. */
export function abortStudyStreamOnClientDisconnect(
  res: { writableFinished?: boolean; on: (ev: string, fn: () => void) => void },
  abort: AbortController
): void {
  res.on("close", () => {
    if (!res.writableFinished) {
      abort.abort();
    }
  });
}
