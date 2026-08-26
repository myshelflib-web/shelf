import { logger } from "../utils/logger.js";
import {
  apiKeyHint,
  chatModelCandidates,
  clearWorkingChatModel,
  isGeminiBaseUrl,
  isModelUnavailableError,
  llmApiKey,
  llmBaseUrl,
  llmMaxOutputTokens,
  parseProviderError,
  rememberWorkingChatModel,
} from "./llmConfig.js";
import {
  acquireGeminiChatSlot,
  geminiChatMaxAttempts,
  parseGeminiRetryMs,
} from "./geminiLimits.js";
import type {
  ChatMessage,
  ChatRequestOpts,
  ChatResult,
  ChatToolCall,
} from "./llmTypes.js";

export type {
  ChatContentPart,
  ChatMessage,
  ChatRequestOpts,
  ChatResult,
  ChatToolCall,
  ChatToolDef,
} from "./llmTypes.js";
export { isToolsUnsupportedMessage } from "./llmTypes.js";

function isTransientStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Per-model free-tier RPD/RPM — other Gemini models on the same key may still work. */
export function isFreeTierQuotaMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("free_tier") ||
    m.includes("free tier") ||
    m.includes("generate_content_free_tier")
  );
}

/** Account/billing exhaustion — unlikely that another model on this key helps. */
export function isHardBillingQuotaMessage(message: string): boolean {
  if (isFreeTierQuotaMessage(message)) return false;
  const m = message.toLowerCase();
  return (
    m.includes("insufficient_quota") ||
    m.includes("billing details") ||
    (m.includes("exceeded your current quota") && m.includes("billing"))
  );
}

async function requestChatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  opts: ChatRequestOpts
): Promise<Response> {
  const payload: Record<string, unknown> = {
    model,
    temperature: 0.2,
    max_tokens: llmMaxOutputTokens(),
    stream: opts.stream,
    messages,
  };
  if (opts.tools?.length) {
    payload.tools = opts.tools;
    payload.tool_choice = opts.toolChoice ?? "auto";
  }
  return fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });
}

function throwForFailedStatus(
  status: number,
  body: string,
  model: string,
  baseUrl: string,
  apiKey: string
): never {
  const providerMessage = parseProviderError(body);

  logger.error("llm.request.failed", {
    status,
    model,
    baseUrl,
    keyHint: apiKeyHint(apiKey),
    body: body.slice(0, 400),
  });

  if (status === 401 || status === 403) {
    throw new Error(
      "Study AI API key is invalid. Set a valid LLM_API_KEY on the backend."
    );
  }
  if (status === 429) {
    if (isFreeTierQuotaMessage(providerMessage)) {
      throw new Error(
        "Gemini free-tier quota is used up for now. Wait for the daily reset, switch LLM_MODEL to another Gemini model, or enable billing in Google AI Studio."
      );
    }
    if (isHardBillingQuotaMessage(providerMessage)) {
      throw new Error(
        "Study AI quota exceeded. Add billing or credits for your LLM provider."
      );
    }
    throw new Error("Study AI rate limit hit. Wait a moment and try again.");
  }
  if (isModelUnavailableError(status, providerMessage)) {
    throw new Error(
      providerMessage
        ? `Study AI model error: ${providerMessage}`
        : `Study AI model "${model}" was not found. Check LLM_MODEL on the backend.`
    );
  }
  if (providerMessage) {
    throw new Error(`Study AI error (${status}): ${providerMessage}`);
  }
  throw new Error(
    `Study AI request failed (${status}). ${body.slice(0, 120) || "Try again in a moment."}`
  );
}

async function openChatWithFallbacks(
  messages: ChatMessage[],
  opts: ChatRequestOpts
): Promise<{ response: Response; model: string; baseUrl: string; apiKey: string }> {
  const apiKey = llmApiKey();
  if (!apiKey) {
    throw new Error(
      "Study AI is not configured. Set LLM_API_KEY (or OPENAI_API_KEY) on the backend."
    );
  }

  const baseUrl = llmBaseUrl();
  const candidates = chatModelCandidates();
  let lastFail: { status: number; body: string; model: string } | null = null;

  for (let i = 0; i < candidates.length; i++) {
    const model = candidates[i];
    const gemini = isGeminiBaseUrl(baseUrl);
    const maxAttempts = gemini ? geminiChatMaxAttempts() : 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      let response: Response;
      try {
        if (attempt === 1 && gemini) {
          await acquireGeminiChatSlot();
        }
        response = await requestChatCompletion(
          baseUrl,
          apiKey,
          model,
          messages,
          opts
        );
      } catch (err) {
        if (
          opts.signal?.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          throw err;
        }
        logger.error("llm.request.network_failed", {
          model,
          baseUrl,
          attempt,
          keyHint: apiKeyHint(apiKey),
          errMessage: err instanceof Error ? err.message : String(err),
        });
        if (attempt < maxAttempts) {
          await sleep(400 * attempt);
          continue;
        }
        throw new Error(
          `Study AI could not reach ${baseUrl}. Check LLM_BASE_URL and network.`
        );
      }

      if (response.ok) {
        if (i > 0) {
          logger.warn("llm.model.fallback_used", {
            baseUrl,
            requested: candidates[0],
            using: model,
          });
        }
        rememberWorkingChatModel(baseUrl, model);
        return { response, model, baseUrl, apiKey };
      }

      const body = await response.text().catch(() => "");
      const providerMessage = parseProviderError(body);
      lastFail = { status: response.status, body, model };

      const freeTierQuota =
        response.status === 429 && isFreeTierQuotaMessage(providerMessage);
      const hardBilling =
        response.status === 429 && isHardBillingQuotaMessage(providerMessage);

      // Same-model retries help RPM / transient 5xx — not daily free-tier exhaustion.
      if (
        isTransientStatus(response.status) &&
        attempt < maxAttempts &&
        !freeTierQuota &&
        !hardBilling
      ) {
        const waitMs =
          response.status === 429
            ? parseGeminiRetryMs(body, attempt)
            : 500 * attempt;
        logger.warn("llm.request.retry", {
          model,
          status: response.status,
          attempt,
          waitMs,
        });
        await sleep(waitMs);
        continue;
      }

      // Free-tier limits are often per model — try the next Gemini candidate.
      const canFallbackQuotaOrRate =
        response.status === 429 &&
        !hardBilling &&
        i < candidates.length - 1;

      const canFallback =
        canFallbackQuotaOrRate ||
        (isModelUnavailableError(response.status, providerMessage) &&
          i < candidates.length - 1);

      if (canFallback) {
        if (freeTierQuota) {
          clearWorkingChatModel(baseUrl);
          logger.warn("llm.model.free_tier_exhausted_trying_next", {
            model,
            next: candidates[i + 1],
            providerMessage: providerMessage || null,
          });
        } else if (canFallbackQuotaOrRate) {
          const waitMs = Math.min(25_000, parseGeminiRetryMs(body, 1));
          logger.warn("llm.model.rate_limited_trying_next", {
            model,
            next: candidates[i + 1],
            waitMs,
            providerMessage: providerMessage || null,
          });
          await sleep(waitMs);
        } else {
          logger.warn("llm.model.unavailable_trying_next", {
            model,
            status: response.status,
            next: candidates[i + 1],
            providerMessage: providerMessage || null,
          });
        }
        break;
      }

      throwForFailedStatus(response.status, body, model, baseUrl, apiKey);
    }
  }

  if (lastFail) {
    throwForFailedStatus(
      lastFail.status,
      lastFail.body,
      lastFail.model,
      baseUrl,
      apiKey
    );
  }

  throw new Error("Study AI request failed. Try again in a moment.");
}

function readToolCalls(
  raw: unknown
): ChatToolCall[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const calls: ChatToolCall[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as {
      id?: string;
      type?: string;
      function?: { name?: string; arguments?: string };
    };
    const name = rec.function?.name;
    if (!name) continue;
    calls.push({
      id: rec.id || `call_${calls.length}`,
      type: "function",
      function: {
        name,
        arguments:
          typeof rec.function?.arguments === "string"
            ? rec.function.arguments
            : "{}",
      },
    });
  }
  return calls.length ? calls : undefined;
}

export async function completeChat(
  messages: ChatMessage[],
  opts?: Omit<ChatRequestOpts, "stream">
): Promise<ChatResult> {
  const { response } = await openChatWithFallbacks(messages, {
    stream: false,
    ...opts,
  });
  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string | null; tool_calls?: unknown };
    }>;
    usage?: {
      total_tokens?: number;
      prompt_tokens?: number;
      completion_tokens?: number;
    };
  };
  const message = data.choices?.[0]?.message;
  const text = (message?.content ?? "").trim();
  const toolCalls = readToolCalls(message?.tool_calls);
  if (!text && !toolCalls?.length) {
    throw new Error("Study AI returned an empty response.");
  }
  const tokens =
    data.usage?.total_tokens ??
    (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0);
  return {
    text,
    tokens: tokens || Math.ceil((text.length + 200) / 4),
    toolCalls,
  };
}

export type StreamChatEvent =
  | { type: "delta"; text: string }
  | { type: "tool_calls"; calls: ChatToolCall[] }
  | { type: "done"; tokens: number; model: string };

type ToolCallAcc = {
  id: string;
  name: string;
  arguments: string;
};

/** OpenAI-compatible SSE token stream with model fallbacks + transient retries. */
export async function* streamChat(
  messages: ChatMessage[],
  opts?: Omit<ChatRequestOpts, "stream">
): AsyncGenerator<StreamChatEvent> {
  const { response, model } = await openChatWithFallbacks(messages, {
    stream: true,
    ...opts,
  });
  if (!response.body) {
    throw new Error("Study AI returned an empty stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  const acc = new Map<number, ToolCallAcc>();

  const absorbToolDelta = (raw: unknown) => {
    if (!Array.isArray(raw)) return;
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const rec = row as {
        index?: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      };
      const index = typeof rec.index === "number" ? rec.index : acc.size;
      const prev = acc.get(index) ?? { id: "", name: "", arguments: "" };
      if (rec.id) prev.id = rec.id;
      if (rec.function?.name) prev.name += rec.function.name;
      if (typeof rec.function?.arguments === "string") {
        prev.arguments += rec.function.arguments;
      }
      acc.set(index, prev);
    }
  };

  try {
    while (true) {
      if (opts?.signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{
              delta?: { content?: string; tool_calls?: unknown };
            }>;
          };
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.tool_calls) absorbToolDelta(delta.tool_calls);
          const piece = delta?.content;
          if (piece) {
            full += piece;
            yield { type: "delta", text: piece };
          }
        } catch {
          // ignore malformed SSE chunks
        }
      }
    }
  } catch (err) {
    if (opts?.signal?.aborted || (err as Error)?.name === "AbortError") {
      // persist whatever streamed
    } else {
      throw err;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }

  const calls: ChatToolCall[] = [...acc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, row], i) => ({
      id: row.id || `call_${i}`,
      type: "function" as const,
      function: { name: row.name, arguments: row.arguments || "{}" },
    }))
    .filter((c) => c.function.name);

  if (calls.length) {
    yield { type: "tool_calls", calls };
  }

  if (!full.trim() && !calls.length && !opts?.signal?.aborted) {
    throw new Error("Study AI returned an empty response.");
  }

  yield {
    type: "done",
    tokens: Math.ceil((full.length + 200) / 4),
    model,
  };
}
