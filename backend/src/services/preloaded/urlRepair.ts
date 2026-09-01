import { completeChat } from "../llm.js";
import { chatModel, llmMaxOutputTokens } from "../llmConfig.js";
import { logger } from "../../utils/logger.js";
import { parsePublicHttpUrl } from "../../utils/publicUrl.js";

export type UrlRepairSuggestion = {
  url: string;
  confidence: "high" | "medium" | "low";
  reason: string;
};

type RepairContext = {
  title: string;
  summary: string | null;
  oldUrl: string;
  subjectName: string;
  topicTitle: string;
  studyGoal: string | null;
};

function parseSuggestion(text: string): UrlRepairSuggestion | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      url?: string;
      confidence?: string;
      reason?: string;
    };
    const url = parsed.url?.trim();
    if (!url || !parsePublicHttpUrl(url)) return null;
    const confidence =
      parsed.confidence === "high" ||
      parsed.confidence === "medium" ||
      parsed.confidence === "low"
        ? parsed.confidence
        : "low";
    return {
      url,
      confidence,
      reason: (parsed.reason ?? "").slice(0, 300),
    };
  } catch {
    return null;
  }
}

/** System-only LLM call — not billed to any user. Rate-limited by caller. */
export async function suggestOfficialUrl(
  ctx: RepairContext
): Promise<UrlRepairSuggestion | null> {
  if (process.env.PRELOADED_URL_REPAIR !== "true") return null;
  if (!process.env.LLM_API_KEY && !process.env.LLM_API_KEY_FREE) {
    logger.warn("preloaded.url_repair.no_llm_key");
    return null;
  }

  const prompt = [
    "You help maintain official government and institutional study links for an Indian exam-prep library.",
    "The old URL is broken or outdated. Suggest ONE replacement official URL on a government, university, or regulator domain.",
    "Reply with JSON only: {\"url\":\"https://...\",\"confidence\":\"high|medium|low\",\"reason\":\"brief\"}",
    "Prefer .gov.in, .nic.in, .ac.in, .org.in, or known official portals. Do not suggest aggregators or piracy sites.",
    "",
    `Title: ${ctx.title}`,
    `Collection: ${ctx.subjectName}`,
    `Topic: ${ctx.topicTitle}`,
    ctx.studyGoal ? `Study goal: ${ctx.studyGoal}` : "",
    ctx.summary ? `Summary: ${ctx.summary}` : "",
    `Broken URL: ${ctx.oldUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await completeChat(
      [
        {
          role: "system",
          content:
            "Return a single JSON object with url, confidence, and reason. No markdown.",
        },
        { role: "user", content: prompt },
      ],
      {
        metricsFlow: "preloaded_url_repair",
        maxTokens: Math.min(400, llmMaxOutputTokens()),
        temperature: 0.2,
        model: process.env.PRELOADED_URL_REPAIR_MODEL ?? chatModel(),
      }
    );
    const suggestion = parseSuggestion(result.text);
    if (!suggestion) {
      logger.warn("preloaded.url_repair.parse_failed", { title: ctx.title });
    }
    return suggestion;
  } catch (err) {
    logger.warn("preloaded.url_repair.llm_failed", {
      title: ctx.title,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
