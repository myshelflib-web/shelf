import { completeChat } from "./llm.js";
import { resolveApiKeyRouteForUserId } from "./apiKeyRoute.js";
import type { AiWritingHeuristic } from "./originalityCheck.js";

export type ParaphraseStyle =
  | "paraphrase"
  | "simplify"
  | "formal"
  | "shorten";

export type ParaphraseResult = {
  style: ParaphraseStyle;
  variants: string[];
  tokens: number;
};

const STYLE_INSTRUCTIONS: Record<ParaphraseStyle, string> = {
  paraphrase:
    "Rewrite in the learner's own words. Keep meaning and key terms; change sentence structure. Do not add new facts.",
  simplify:
    "Rewrite in clearer, simpler English suitable for revision notes. Keep meaning; shorter sentences.",
  formal:
    "Rewrite in a formal academic register suitable for exam answers. Keep meaning; do not invent citations.",
  shorten:
    "Condense to roughly half the length while keeping the essential meaning. Drop filler only.",
};

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("No JSON object in model reply");
  return JSON.parse(body.slice(start, end + 1)) as unknown;
}

export async function paraphraseText(
  userId: string,
  text: string,
  style: ParaphraseStyle = "paraphrase"
): Promise<ParaphraseResult> {
  const source = text.trim().slice(0, 8_000);
  if (source.length < 12) {
    throw new Error("Text is too short to paraphrase.");
  }

  const apiKeyRoute = await resolveApiKeyRouteForUserId(userId);
  const instruction = STYLE_INSTRUCTIONS[style] ?? STYLE_INSTRUCTIONS.paraphrase;

  const result = await completeChat(
    [
      {
        role: "system",
        content: `You help students rewrite study notes. ${instruction}
Return ONLY valid JSON: {"variants":["...","...","..."]} with 2 or 3 distinct rewrites.
No markdown outside JSON. Preserve numbers, names, and technical terms.`,
      },
      {
        role: "user",
        content: source,
      },
    ],
    {
      apiKeyRoute,
      metricsFlow: "writing_paraphrase",
      temperature: 0.55,
      maxTokens: 1_200,
    }
  );

  let variants: string[] = [];
  try {
    const parsed = extractJsonObject(result.text) as { variants?: unknown };
    if (Array.isArray(parsed.variants)) {
      variants = parsed.variants
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch {
    const fallback = result.text.trim();
    if (fallback) variants = [fallback];
  }

  if (variants.length === 0) {
    throw new Error("Paraphrase returned empty text.");
  }

  return { style, variants, tokens: result.tokens };
}

const AI_DISCLAIMER =
  "Heuristic only — not a certified AI detector. Short or formulaic study notes often look \"AI-like.\" Use judgment.";

export type AiHeuristicResult = AiWritingHeuristic & { tokens: number };

export async function detectAiWritingHeuristic(
  userId: string,
  text: string
): Promise<AiHeuristicResult> {
  const source = text.trim().slice(0, 8_000);
  if (source.length < 40) {
    return {
      kind: "ai_heuristic",
      likelihood: "unknown",
      score: 0,
      summary: "Not enough text for a heuristic check.",
      signals: [],
      disclaimer: AI_DISCLAIMER,
      tokens: 0,
    };
  }

  const apiKeyRoute = await resolveApiKeyRouteForUserId(userId);
  const result = await completeChat(
    [
      {
        role: "system",
        content: `You estimate whether study prose looks AI-generated. Be conservative.
Return ONLY JSON:
{"likelihood":"low"|"medium"|"high","score":0-100,"summary":"one sentence","signals":["short bullet",...]}
score = rough confidence that text is AI-like (not human originality %).
Focus on: uniform tone, stock transitions, low specificity, missing personal examples.
Never claim certainty. No markdown outside JSON.`,
      },
      { role: "user", content: source },
    ],
    {
      apiKeyRoute,
      metricsFlow: "writing_ai_heuristic",
      temperature: 0.2,
      maxTokens: 400,
    }
  );

  try {
    const parsed = extractJsonObject(result.text) as {
      likelihood?: string;
      score?: number;
      summary?: string;
      signals?: unknown;
    };
    const likelihood =
      parsed.likelihood === "low" ||
      parsed.likelihood === "medium" ||
      parsed.likelihood === "high"
        ? parsed.likelihood
        : "unknown";
    const score = Math.max(
      0,
      Math.min(100, Math.round(Number(parsed.score) || 0))
    );
    const signals = Array.isArray(parsed.signals)
      ? parsed.signals.map((s) => String(s).trim()).filter(Boolean).slice(0, 6)
      : [];
    return {
      kind: "ai_heuristic",
      likelihood,
      score,
      summary: String(parsed.summary ?? "Heuristic estimate complete.").slice(
        0,
        400
      ),
      signals,
      disclaimer: AI_DISCLAIMER,
      tokens: result.tokens,
    };
  } catch {
    return {
      kind: "ai_heuristic",
      likelihood: "unknown",
      score: 0,
      summary: "Could not parse heuristic result.",
      signals: [],
      disclaimer: AI_DISCLAIMER,
      tokens: result.tokens,
    };
  }
}
