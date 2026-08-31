/** Estimated USD per 1M tokens (input / output). Used for Grafana cost dashboards only. */
export type ModelRates = {
  inputPerM: number;
  outputPerM: number;
};

const DEFAULT_CHAT: ModelRates = { inputPerM: 0.1, outputPerM: 0.4 };
const EMBEDDING: ModelRates = { inputPerM: 0.025, outputPerM: 0 };

const MODEL_RATES: Record<string, ModelRates> = {
  "gemini-flash-lite-latest": { inputPerM: 0.075, outputPerM: 0.3 },
  "gemini-3.5-flash-lite": { inputPerM: 0.075, outputPerM: 0.3 },
  "gemini-3.1-flash-lite": { inputPerM: 0.075, outputPerM: 0.3 },
  "gemini-flash-latest": { inputPerM: 0.15, outputPerM: 0.6 },
  "gemini-3.5-flash": { inputPerM: 0.15, outputPerM: 0.6 },
  "gemini-3.6-flash": { inputPerM: 0.15, outputPerM: 0.6 },
  "gemini-3.7-flash": { inputPerM: 0.15, outputPerM: 0.6 },
  "gemini-embedding-001": EMBEDDING,
  "gemini-embedding-002": { inputPerM: 0.025, outputPerM: 0 },
  "text-embedding-3-small": { inputPerM: 0.02, outputPerM: 0 },
  "text-embedding-3-large": { inputPerM: 0.13, outputPerM: 0 },
};

export function normalizeModelId(model: string): string {
  return model.replace(/^models\//, "").trim().toLowerCase();
}

export function ratesForModel(model: string): ModelRates {
  const id = normalizeModelId(model);
  if (MODEL_RATES[id]) return MODEL_RATES[id];
  if (id.includes("embed")) return EMBEDDING;
  if (id.includes("lite")) return MODEL_RATES["gemini-flash-lite-latest"]!;
  if (id.includes("flash")) return MODEL_RATES["gemini-flash-latest"]!;
  return DEFAULT_CHAT;
}

export type TokenUsage = {
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
};

/** Split unknown usage ~70% prompt / 30% completion for cost estimate. */
export function resolveTokenSplit(usage: TokenUsage): {
  prompt: number;
  completion: number;
  total: number;
} {
  const prompt = Math.max(0, usage.promptTokens ?? 0);
  const completion = Math.max(0, usage.completionTokens ?? 0);
  const explicit = prompt + completion;
  if (explicit > 0) {
    return { prompt, completion, total: explicit };
  }
  const total = Math.max(0, usage.totalTokens ?? 0);
  if (total <= 0) return { prompt: 0, completion: 0, total: 0 };
  const estPrompt = Math.round(total * 0.7);
  return { prompt: estPrompt, completion: total - estPrompt, total };
}

/** Estimated USD for a single LLM / embedding call. */
export function estimateCostUsd(model: string, usage: TokenUsage): number {
  const rates = ratesForModel(model);
  const { prompt, completion, total } = resolveTokenSplit(usage);
  if (total <= 0) return 0;
  const inputUsd = (prompt / 1_000_000) * rates.inputPerM;
  const outputUsd = (completion / 1_000_000) * rates.outputPerM;
  return inputUsd + outputUsd;
}
