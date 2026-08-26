/** Shared OpenAI-compatible LLM / embedding settings from env. */

const RETIRED_GEMINI_EMBEDDING_MODELS: Record<string, string> = {
  "text-embedding-004": "gemini-embedding-001",
  "models/text-embedding-004": "gemini-embedding-001",
  "embedding-001": "gemini-embedding-001",
  "text-embedding-005": "gemini-embedding-001",
};

/** Chat models Google has restricted for new API keys / retired early. */
const RETIRED_GEMINI_CHAT_MODELS: Record<string, string> = {
  "gemini-2.5-flash": "gemini-flash-latest",
  "models/gemini-2.5-flash": "gemini-flash-latest",
  "gemini-2.5-flash-lite": "gemini-flash-lite-latest",
  "models/gemini-2.5-flash-lite": "gemini-flash-lite-latest",
  "gemini-2.0-flash": "gemini-flash-latest",
  "gemini-2.0-flash-lite": "gemini-flash-lite-latest",
};

/**
 * Tried in order when the configured Gemini chat model returns 404 /
 * "no longer available". Lite-first keeps free-tier latency down.
 * Override with comma-separated `LLM_MODEL_FALLBACKS`.
 */
export const DEFAULT_GEMINI_CHAT_FALLBACKS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
];

const GEMINI_OPENAI_COMPAT =
  "https://generativelanguage.googleapis.com/v1beta/openai";

/** Process-lifetime: last model that succeeded for a given chat host. */
const preferredChatModelByBase = new Map<string, string>();

/** Cap completion length (lower = faster on free tier). */
export function llmMaxOutputTokens(): number {
  const n = Number(process.env.LLM_MAX_OUTPUT_TOKENS ?? 1024);
  return Number.isFinite(n) && n > 64 ? Math.min(n, 8192) : 1024;
}

/** Strip quotes/whitespace Render sometimes wraps around secrets. */
export function sanitizeSecret(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

export function llmApiKey(): string | undefined {
  return sanitizeSecret(process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY);
}

function isOllamaBaseUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("11434") || u.includes("ollama");
}

/** Normalize Gemini chat model ids (strip models/ prefix; remap retired names). */
export function resolveGeminiChatModel(model: string): string {
  const trimmed = model.trim().replace(/^models\//, "");
  return (
    RETIRED_GEMINI_CHAT_MODELS[trimmed] ??
    RETIRED_GEMINI_CHAT_MODELS[`models/${trimmed}`] ??
    trimmed
  );
}

export function chatModel(): string {
  const explicit = process.env.LLM_MODEL?.trim();
  if (explicit) {
    if (explicit.toLowerCase().includes("gemini")) {
      return resolveGeminiChatModel(explicit);
    }
    return explicit;
  }

  const base = (process.env.LLM_BASE_URL ?? "").toLowerCase();
  if (isOllamaBaseUrl(base)) return "llama3.2:1b";
  if (base.includes("api.groq.com")) return "llama-3.1-8b-instant";
  // Lite-first keeps free-tier latency down; set LLM_MODEL=gemini-flash-latest for quality.
  return "gemini-flash-lite-latest";
}

export function llmBaseUrl(): string {
  const explicit = process.env.LLM_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  if (chatModel().toLowerCase().startsWith("gemini")) {
    return GEMINI_OPENAI_COMPAT;
  }
  return "https://api.openai.com/v1";
}

export function rememberWorkingChatModel(baseUrl: string, model: string): void {
  preferredChatModelByBase.set(baseUrl, model);
}

export function clearWorkingChatModel(baseUrl?: string): void {
  if (baseUrl) preferredChatModelByBase.delete(baseUrl);
  else preferredChatModelByBase.clear();
}

function geminiFallbacksFromEnv(): string[] {
  const raw = process.env.LLM_MODEL_FALLBACKS?.trim();
  if (!raw) return DEFAULT_GEMINI_CHAT_FALLBACKS;
  return raw
    .split(",")
    .map((s) => resolveGeminiChatModel(s.trim()))
    .filter(Boolean);
}

/**
 * Ordered model ids to try for this request (preferred → configured → fallbacks).
 * Deduped. Non-Gemini hosts only get the configured model.
 */
export function chatModelCandidates(): string[] {
  const base = llmBaseUrl();
  const primary = chatModel();
  const preferred = preferredChatModelByBase.get(base);

  if (!primary.toLowerCase().includes("gemini") && !isGeminiBaseUrl(base)) {
    return preferred && preferred !== primary ? [preferred, primary] : [primary];
  }

  const ordered = [
    preferred,
    primary,
    ...geminiFallbacksFromEnv(),
  ].filter((m): m is string => Boolean(m));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of ordered) {
    const id = resolveGeminiChatModel(m);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function isModelUnavailableError(
  status: number,
  providerMessage: string
): boolean {
  if (status === 404) return true;
  return /no longer available|model .+ not found|not_found|is not found/i.test(
    providerMessage
  );
}

/** True when chat/embedding base URL points at Groq (no embeddings API). */
export function isGroqBaseUrl(url: string): boolean {
  return url.toLowerCase().includes("api.groq.com");
}

/** True when embeddings should use Google Gemini (native or OpenAI-compat host). */
export function isGeminiBaseUrl(url: string): boolean {
  return url.toLowerCase().includes("generativelanguage.googleapis.com");
}

export function geminiNativeBaseUrl(): string {
  return "https://generativelanguage.googleapis.com/v1beta";
}

/** Gemini REST path slug (gemini-embedding-001), not models/gemini-embedding-001. */
export function geminiEmbeddingModelSlug(model: string): string {
  return model.trim().replace(/^models\//, "");
}

/** Gemini request body model id (models/gemini-embedding-001). */
export function geminiEmbeddingModelId(model: string): string {
  const slug = geminiEmbeddingModelSlug(model);
  return `models/${slug}`;
}

/** Map shut-down Gemini embedding model ids to the current one. */
export function resolveGeminiEmbeddingModel(model: string): string {
  const trimmed = model.trim();
  return RETIRED_GEMINI_EMBEDDING_MODELS[trimmed] ?? trimmed;
}

/**
 * Embeddings can use a different provider than chat.
 * Groq has chat only — never send a Groq key to Gemini.
 */
export function embeddingApiKey(): string | undefined {
  const embeddingKey = sanitizeSecret(process.env.EMBEDDING_API_KEY);
  if (embeddingKey) return embeddingKey;

  if (isGeminiBaseUrl(embeddingBaseUrl())) {
    return undefined;
  }

  return sanitizeSecret(process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY);
}

/** Safe log hint — never log the full secret. */
export function apiKeyHint(key: string | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("AQ.")) return `AQ.…(len=${key.length})`;
  if (key.startsWith("AIza")) return `AIza…(len=${key.length})`;
  if (key.startsWith("gsk_")) return `gsk_…(len=${key.length})`;
  if (key.startsWith("sk-")) return `sk-…(len=${key.length})`;
  return `${key.slice(0, 4)}…(len=${key.length})`;
}

export function embeddingBaseUrl(): string {
  const explicit = process.env.EMBEDDING_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const chat = llmBaseUrl();
  if (isGroqBaseUrl(chat)) {
    return "https://api.openai.com/v1";
  }
  return chat;
}

/**
 * Embedding model for vector indexing.
 * Must be a model your embedding provider serves (not Groq — Groq has no embeddings).
 */
export function embeddingModel(): string {
  const explicit = process.env.EMBEDDING_MODEL?.trim();
  const base = embeddingBaseUrl().toLowerCase();

  if (explicit) {
    if (base.includes("generativelanguage.googleapis.com")) {
      return resolveGeminiEmbeddingModel(explicit);
    }
    return explicit;
  }

  if (base.includes("11434") || base.includes("ollama")) {
    return "nomic-embed-text";
  }
  if (base.includes("generativelanguage.googleapis.com")) {
    return "gemini-embedding-001";
  }
  return "text-embedding-3-small";
}

export function parseProviderError(body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string };
    };
    return parsed.error?.message?.trim() ?? "";
  } catch {
    return body.slice(0, 200).trim();
  }
}

/** Non-secret snapshot for startup / debug logs. */
export function embeddingConfigSummary(): Record<string, unknown> {
  const baseUrl = embeddingBaseUrl();
  const key = embeddingApiKey();
  return {
    embeddingBaseUrl: baseUrl,
    embeddingModel: embeddingModel(),
    embeddingKeyHint: apiKeyHint(key),
    hasEmbeddingApiKey: Boolean(process.env.EMBEDDING_API_KEY?.trim()),
    isGemini: isGeminiBaseUrl(baseUrl),
  };
}

/** Non-secret chat LLM snapshot (safe to log). */
export function llmConfigSummary(): Record<string, unknown> {
  const baseUrl = llmBaseUrl();
  const key = llmApiKey();
  return {
    llmBaseUrl: baseUrl,
    llmModel: chatModel(),
    llmKeyHint: apiKeyHint(key),
    envModel: process.env.LLM_MODEL?.trim() || null,
    isGemini: isGeminiBaseUrl(baseUrl),
    modelCandidates: chatModelCandidates(),
  };
}
