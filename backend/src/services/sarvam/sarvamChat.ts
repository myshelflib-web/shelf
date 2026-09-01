import { fetchWithRetry, HttpResponseError } from "../../utils/fetchRetry.js";
import { logger } from "../../utils/logger.js";
import { parseProviderError } from "../llmConfig.js";
import type { ChatMessage } from "../llmTypes.js";
import {
  sarvamApiKey,
  sarvamBaseUrl,
  sarvamMaxOutputTokens,
  sarvamModel,
} from "./sarvamConfig.js";

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
};

export type SarvamChatResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

type SarvamCompletionBody = {
  choices?: { message?: { content?: string | null } }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

/** Rough fallback when the provider omits usage (~4 chars per token). */
function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** Sarvam exposes an OpenAI-compatible /chat/completions endpoint. */
export async function sarvamChat(
  messages: ChatMessage[],
  opts: SarvamChatOpts = {}
): Promise<SarvamChatResult> {
  const apiKey = sarvamApiKey();
  if (!apiKey) throw new SarvamNotConfiguredError();

  const model = opts.model || sarvamModel();
  const baseUrl = sarvamBaseUrl();

  let res: Response;
  try {
    res = await fetchWithRetry(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: opts.temperature ?? 0.3,
        max_tokens: opts.maxTokens ?? sarvamMaxOutputTokens(),
        stream: false,
      }),
      signal: opts.signal,
      timeoutMs: 180_000,
      retry: { label: "sarvam_chat", attempts: 3 },
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

  let body: SarvamCompletionBody;
  try {
    body = JSON.parse(raw) as SarvamCompletionBody;
  } catch {
    throw new Error("Sarvam returned a non-JSON response");
  }

  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Sarvam returned an empty completion");

  const promptText = messages
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n");

  const result: SarvamChatResult = {
    text,
    model,
    inputTokens: body.usage?.prompt_tokens ?? approxTokens(promptText),
    outputTokens: body.usage?.completion_tokens ?? approxTokens(text),
  };

  logger.debug("sarvam.chat.ok", {
    model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return result;
}
