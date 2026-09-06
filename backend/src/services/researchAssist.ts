import { completeChat } from "./llm.js";
import { resolveApiKeyRouteForUserId } from "./apiKeyRoute.js";

export type ResearchAssistKind = "tighten_abstract" | "check_claims";

export type ResearchAssistResult = {
  kind: ResearchAssistKind;
  text: string;
  tokens: number;
};

export async function researchAssist(
  userId: string,
  kind: ResearchAssistKind,
  text: string,
  opts?: { maxWords?: number; bibKeys?: string[] }
): Promise<ResearchAssistResult> {
  const source = text.trim().slice(0, 12_000);
  if (source.length < 20) {
    throw new Error("Text is too short for research assist.");
  }

  const apiKeyRoute = await resolveApiKeyRouteForUserId(userId);
  const maxWords = opts?.maxWords ?? 150;
  const keys = (opts?.bibKeys || []).filter(Boolean).slice(0, 40);

  const system =
    kind === "tighten_abstract"
      ? `Tighten this abstract to about ${maxWords} words. Keep meaning, methods, and key findings. Return ONLY the rewritten abstract as plain text.`
      : `You check academic claims against bibliography keys. Keys present: [${keys.join(", ") || "none"}].
List claims that appear unsupported by those keys. Be concise. Return plain text bullets.`;

  const result = await completeChat(
    [
      { role: "system", content: system },
      { role: "user", content: source },
    ],
    {
      apiKeyRoute,
      metricsFlow: "research_assist",
      temperature: 0.35,
      maxTokens: 1_200,
    }
  );

  return {
    kind,
    text: result.text.trim(),
    tokens: result.tokens ?? 0,
  };
}
