import { isPremiumUser } from "../utils/paywall.js";
import { QuotaError } from "../utils/quotas.js";
import { chatModel, llmMaxOutputTokens } from "./llmConfig.js";

export type StudyDepth = "quick" | "standard" | "deep";

export function parseStudyDepth(raw: unknown): StudyDepth {
  if (raw === "standard" || raw === "deep") return raw;
  return "quick";
}

type DepthUser = {
  plan: string;
  role: string;
  subscriptionExpiresAt?: Date | string | null;
};

export function assertDepthAllowed(user: DepthUser, depth: StudyDepth): void {
  if (depth === "deep" && user.role !== "ADMIN" && !isPremiumUser(user)) {
    throw new QuotaError(
      "Deep analysis requires Premium. Upgrade for longer, thorough answers — or use Standard mode."
    );
  }
}

export type StudyDepthConfig = {
  depth: StudyDepth;
  model: string;
  maxTokens: number;
  pageContextBudget: number;
  libraryContextBudget: number;
  toolRounds: number;
  mapReduce: boolean;
  temperature: number;
  tokenEstimateMultiplier: number;
};

function envModel(key: string, fallback: string): string {
  const v = process.env[key]?.trim();
  return v || fallback;
}

function envInt(key: string, fallback: number): number {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Per-depth LLM + context settings (Quick = current default behavior). */
export function studyDepthConfig(depth: StudyDepth): StudyDepthConfig {
  const quickModel = envModel("LLM_MODEL_FAST", chatModel());

  switch (depth) {
    case "standard":
      return {
        depth,
        model: envModel("LLM_MODEL_STANDARD", "gemini-flash-latest"),
        maxTokens: envInt("LLM_MAX_OUTPUT_TOKENS_STANDARD", 4096),
        pageContextBudget: envInt("PAGE_ASK_CONTEXT_BUDGET_STANDARD", 12_000),
        libraryContextBudget: envInt("LIBRARY_CONTEXT_BUDGET_STANDARD", 16_000),
        toolRounds: 5,
        mapReduce: false,
        temperature: 0.25,
        tokenEstimateMultiplier: 2.5,
      };
    case "deep":
      return {
        depth,
        model: envModel("LLM_MODEL_DEEP", "gemini-3.5-flash"),
        maxTokens: envInt("LLM_MAX_OUTPUT_TOKENS_DEEP", 8192),
        pageContextBudget: envInt("PAGE_ASK_CONTEXT_BUDGET_DEEP", 20_000),
        libraryContextBudget: envInt("LIBRARY_CONTEXT_BUDGET_DEEP", 24_000),
        toolRounds: 10,
        mapReduce: true,
        temperature: 0.3,
        tokenEstimateMultiplier: 5,
      };
    default:
      return {
        depth: "quick",
        model: quickModel,
        maxTokens: llmMaxOutputTokens(),
        pageContextBudget: envInt("PAGE_ASK_CONTEXT_BUDGET", 6_500),
        libraryContextBudget: envInt("LIBRARY_CONTEXT_BUDGET", 8_000),
        toolRounds: 3,
        mapReduce: false,
        temperature: 0.2,
        tokenEstimateMultiplier: 1,
      };
  }
}

export function estimateDepthTokens(base: number, depth: StudyDepth): number {
  return Math.ceil(base * studyDepthConfig(depth).tokenEstimateMultiplier);
}

/** Skip expensive vector scroll unless deep / deep-summary may map-reduce. */
export function mayPrepareMapReduce(opts: {
  depth: StudyDepth;
  mode: string;
  materialChars: number;
  hasSelection: boolean;
}): boolean {
  if (opts.hasSelection) return false;
  if (opts.mode === "deep-summary") {
    return opts.materialChars > 8_000;
  }
  if (opts.depth !== "deep") return false;
  return (
    opts.materialChars > 10_000 ||
    ["summarize", "notes", "analyze"].includes(opts.mode)
  );
}

/** Map-reduce for long documents when depth or mode warrants full-file synthesis. */
export function shouldMapReduce(opts: {
  depth: StudyDepth;
  mode: string;
  materialChars: number;
  chunkCount: number;
}): boolean {
  if (opts.mode === "deep-summary") {
    return opts.materialChars > 8_000 || opts.chunkCount > 4;
  }
  const cfg = studyDepthConfig(opts.depth);
  if (!cfg.mapReduce) return false;
  if (
    opts.mode === "summarize" ||
    opts.mode === "notes" ||
    opts.mode === "analyze"
  ) {
    return opts.materialChars > 10_000 || opts.chunkCount > 5;
  }
  return false;
}
