import { fetchWithRetry, HttpResponseError } from "../../utils/fetchRetry.js";
import { logger } from "../../utils/logger.js";
import { parseProviderError } from "../llmConfig.js";
import type { ChatMessage } from "../llmTypes.js";
import {
  extractCompletionText,
  type SarvamCompletionBody,
} from "./sarvamParse.js";
import {
  sarvamApiKey,
  sarvamBaseUrl,
  sarvamMaxOutputTokens,
  sarvamModel,
} from "./sarvamConfig.js";
import {
  sarvamAuthHeaders,
  sarvamCompletionPayload,
  type SarvamReasoningEffort,
} from "./sarvamRequest.js";

export type { SarvamReasoningEffort };

export class SarvamNotConfiguredError extends Error {
  constructor() {
    super("SARVAM_API_KEY is not set");
    this.name = "SarvamNotConfiguredError";
  }
}

export type SarvamChatOpts = {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  signal?: AbortSignal;
  /** Default off. On only for revise / unparseable-draft retry. */
  reasoningEffort?: SarvamReasoningEffort;
};

export type SarvamChatResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

/** Pro plan ceiling; Starter silently caps lower. */
const MAX_COMPLETION_TOKENS = 16_000;

function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function requestOnce(
  messages: ChatMessage[],
  opts: SarvamChatOpts & { reasoningEffort: SarvamReasoningEffort; maxTokens: number }
): Promise<{ body: SarvamCompletionBody; model: string }> {
  const apiKey = sarvamApiKey();
  if (!apiKey) throw new SarvamNotConfiguredError();

  const model = opts.model || sarvamModel();
  const baseUrl = sarvamBaseUrl();

  let res: Response;
  try {
    res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: sarvamAuthHeaders(apiKey),
      body: JSON.stringify(
        sarvamCompletionPayload({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          maxTokens: opts.maxTokens,
          reasoningEffort: opts.reasoningEffort,
        })
      ),
      signal: opts.signal,
      timeoutMs: 180_000,
      retry: { label: "sarvam_chat", attempts: 2 },
    });
  } catch (err) {
    if (err instanceof HttpResponseError) {
      const body = await err.response.text().catch(() => "");
      throw new Error(
        `Sarvam request failed (${err.status}): ${parseProviderError(body) || body.slice(0, 200)}`
      );
    }
    throw err;
  }

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(
      `Sarvam request failed (${res.status}): ${parseProviderError(raw) || raw.slice(0, 200)}`
    );
  }

  try {
    return { body: JSON.parse(raw) as SarvamCompletionBody, model };
  } catch {
    throw new Error("Sarvam returned a non-JSON response");
  }
}

/** Sarvam exposes an OpenAI-compatible /chat/completions endpoint. */
export async function sarvamChat(
  messages: ChatMessage[],
  opts: SarvamChatOpts = {}
): Promise<SarvamChatResult> {
  const promptText = messages
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n");

  const requested = opts.reasoningEffort === undefined ? null : opts.reasoningEffort;
  let maxTokens = opts.maxTokens ?? sarvamMaxOutputTokens();
  let reasoningEffort = requested;

  let lastFinish: string | null = null;
  let lastReasoning = 0;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const { body, model } = await requestOnce(messages, {
      ...opts,
      maxTokens,
      reasoningEffort,
    });
    const extracted = extractCompletionText(body);
    lastFinish = extracted.finishReason;
    lastReasoning = extracted.reasoningChars;

    if (extracted.text) {
      const result: SarvamChatResult = {
        text: extracted.text,
        model,
        inputTokens: body.usage?.prompt_tokens ?? approxTokens(promptText),
        outputTokens: body.usage?.completion_tokens ?? approxTokens(extracted.text),
      };
      logger.debug("sarvam.chat.ok", {
        model,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        finishReason: extracted.finishReason,
        reasoningEffort,
        attempt,
      });
      return result;
    }

    logger.warn("sarvam.chat.empty", {
      attempt,
      finishReason: extracted.finishReason,
      reasoningChars: extracted.reasoningChars,
      completionTokens: body.usage?.completion_tokens ?? 0,
      reasoningEffort,
      maxTokens,
    });

    // Empty + length + huge reasoning = thinking ate the budget. Keep it off.
    maxTokens = MAX_COMPLETION_TOKENS;
    reasoningEffort = null;
  }

  throw new Error(
    `Sarvam returned an empty completion (finish_reason=${lastFinish ?? "unknown"}, reasoning_chars=${lastReasoning})`
  );
}
