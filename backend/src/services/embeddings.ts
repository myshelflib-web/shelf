import { logger } from "../utils/logger.js";
import { fetchWithTimeout } from "../utils/timeout.js";
import {
  apiKeyHint,
  embeddingApiKey,
  embeddingBaseUrl,
  embeddingConfigSummary,
  embeddingModel,
  geminiEmbeddingModelId,
  geminiEmbeddingModelSlug,
  geminiNativeBaseUrl,
  isGeminiBaseUrl,
  isGroqBaseUrl,
  parseProviderError,
  resolveGeminiEmbeddingModel,
} from "./llmConfig.js";
import {
  acquireGeminiEmbedSlot,
  DEFAULT_GEMINI_EMBED_BATCH,
  DEFAULT_GEMINI_EMBED_PAUSE_MS,
} from "./geminiLimits.js";

/** Keep Qdrant vectors compact; gemini-embedding-001 supports 768/1536/3072. */
const GEMINI_EMBED_DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS ?? 768
);
/** Free-tier gemini-embedding-001: ~100 RPM / ~30k TPM; small batches + pause. */
const GEMINI_EMBED_BATCH = Number(
  process.env.GEMINI_EMBED_BATCH ?? DEFAULT_GEMINI_EMBED_BATCH
);
const GEMINI_EMBED_PAUSE_MS = Number(
  process.env.GEMINI_EMBED_PAUSE_MS ?? DEFAULT_GEMINI_EMBED_PAUSE_MS
);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetrySeconds(body: string): number {
  const m = body.match(/retry in ([0-9.]+)\s*s/i);
  if (m) return Math.min(90, Math.ceil(Number(m[1]) + 1));
  return 25;
}

export type EmbedTask = "document" | "query";

function geminiTaskType(task?: EmbedTask): string | undefined {
  if (task === "document") return "RETRIEVAL_DOCUMENT";
  if (task === "query") return "RETRIEVAL_QUERY";
  return undefined;
}

async function geminiBatchOnce(
  texts: string[],
  apiKey: string,
  modelId: string,
  modelSlug: string,
  task?: EmbedTask
): Promise<number[][]> {
  const path = `${geminiNativeBaseUrl()}/models/${modelSlug}:batchEmbedContents`;
  const taskType = geminiTaskType(task);
  const body = JSON.stringify({
    requests: texts.map((text) => ({
      model: modelId,
      content: { parts: [{ text }] },
      outputDimensionality: GEMINI_EMBED_DIMENSIONS,
      ...(taskType ? { taskType } : {}),
    })),
  });

  const timeoutMs = Number(process.env.EMBEDDING_TIMEOUT_MS ?? 45_000);
  await acquireGeminiEmbedSlot();
  const response = await fetchWithTimeout(path, {
    method: "POST",
    timeoutMs,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body,
  });

  if (response.ok) {
    const data = (await response.json()) as {
      embeddings?: Array<{ values?: number[] }>;
    };
    const vectors = (data.embeddings ?? []).map((row) => row.values ?? []);
    if (vectors.length !== texts.length || vectors.some((v) => v.length === 0)) {
      throw new Error("Gemini returned an incomplete embedding batch.");
    }
    return vectors;
  }

  const errBody = await response.text().catch(() => "");
  if (response.status === 429) {
    const waitSec = parseRetrySeconds(errBody);
    logger.warn("embeddings.gemini.rate_limited", {
      waitSec,
      batch: texts.length,
      keyHint: apiKeyHint(apiKey),
    });
    await sleep(waitSec * 1000);
    const retry = await fetchWithTimeout(path, {
      method: "POST",
      timeoutMs,
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body,
    });
    if (retry.ok) {
      const data = (await retry.json()) as {
        embeddings?: Array<{ values?: number[] }>;
      };
      return (data.embeddings ?? []).map((row) => row.values ?? []);
    }
    const retryBody = await retry.text().catch(() => "");
    throw new Error(
      `Gemini embeddings rate limited: ${parseProviderError(retryBody) || retryBody.slice(0, 200)}`
    );
  }

  logger.error("embeddings.gemini.failed", {
    status: response.status,
    model: modelId,
    keyHint: apiKeyHint(apiKey),
    body: errBody.slice(0, 300),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "Gemini rejected EMBEDDING_API_KEY. Confirm the key works with " +
        "models/gemini-embedding-001:embedContent and X-goog-api-key."
    );
  }
  if (response.status === 404) {
    throw new Error(
      `Gemini embedding model "${modelSlug}" not found. Set EMBEDDING_MODEL=gemini-embedding-001.`
    );
  }
  const providerMessage = parseProviderError(errBody);
  if (providerMessage) {
    throw new Error(`Gemini embeddings failed: ${providerMessage}`);
  }
  throw new Error("Could not create Gemini embeddings for Study AI retrieval.");
}

async function embedTextsGeminiNative(
  texts: string[],
  apiKey: string,
  model: string,
  task?: EmbedTask
): Promise<number[][]> {
  const resolved = resolveGeminiEmbeddingModel(model);
  const modelId = geminiEmbeddingModelId(resolved);
  const modelSlug = geminiEmbeddingModelSlug(resolved);
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += GEMINI_EMBED_BATCH) {
    const slice = texts.slice(i, i + GEMINI_EMBED_BATCH);
    const vectors = await geminiBatchOnce(slice, apiKey, modelId, modelSlug, task);
    out.push(...vectors);
    if (i + GEMINI_EMBED_BATCH < texts.length) {
      await sleep(GEMINI_EMBED_PAUSE_MS);
    }
  }
  return out;
}

export async function embedTexts(
  texts: string[],
  opts?: { task?: EmbedTask }
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const task = opts?.task;

  const baseUrl = embeddingBaseUrl();
  const model = embeddingModel();
  const apiKey = embeddingApiKey();

  if (isGroqBaseUrl(baseUrl)) {
    throw new Error(
      "Groq does not provide embeddings. Set EMBEDDING_BASE_URL + EMBEDDING_API_KEY + EMBEDDING_MODEL " +
        "(Gemini: EMBEDDING_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai, " +
        "EMBEDDING_MODEL=gemini-embedding-001)."
    );
  }

  if (!apiKey) {
    if (isGeminiBaseUrl(baseUrl)) {
      throw new Error(
        "Set EMBEDDING_API_KEY to your Google AI Studio key (AQ.… / AIza…). " +
          "Do not reuse LLM_API_KEY when chat is on Groq."
      );
    }
    throw new Error(
      "Embeddings need EMBEDDING_API_KEY. Qdrant stores vectors but does not create them."
    );
  }

  if (isGeminiBaseUrl(baseUrl) && apiKey.startsWith("gsk_")) {
    throw new Error(
      "EMBEDDING_API_KEY looks like a Groq key (gsk_). Use a Google AI Studio key instead."
    );
  }

  if (isGeminiBaseUrl(baseUrl)) {
    return embedTextsGeminiNative(texts, apiKey, model, task);
  }

  const timeoutMs = Number(process.env.EMBEDDING_TIMEOUT_MS ?? 45_000);
  const response = await fetchWithTimeout(`${baseUrl}/embeddings`, {
    method: "POST",
    timeoutMs,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: texts }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const providerMessage = parseProviderError(body);
    logger.error("embeddings.failed", {
      status: response.status,
      model,
      baseUrl,
      keyHint: apiKeyHint(apiKey),
      body: body.slice(0, 300),
    });

    if (response.status === 401) {
      throw new Error(
        "Embedding API key is invalid. Set EMBEDDING_API_KEY on the backend (Render env)."
      );
    }
    if (
      response.status === 404 ||
      /model_not_found|does not exist/i.test(providerMessage)
    ) {
      throw new Error(
        `Embedding model "${model}" is not available at ${baseUrl}.`
      );
    }
    if (providerMessage) {
      throw new Error(`Embeddings failed: ${providerMessage}`);
    }
    throw new Error("Could not create embeddings for Study AI retrieval.");
  }

  const data = (await response.json()) as {
    data?: Array<{ embedding: number[]; index: number }>;
  };
  const rows = [...(data.data ?? [])].sort((a, b) => a.index - b.index);
  return rows.map((r) => r.embedding);
}

export function logEmbeddingConfig(): void {
  logger.info("embeddings.config", embeddingConfigSummary());
}
