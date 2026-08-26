import { estimateTokens } from "../../utils/quotas.js";

/**
 * Bill quiz LLM calls against the Study AI quota.
 * Prefer provider `total_tokens` when it includes the prompt; otherwise
 * add a prompt estimate so source excerpts are not free.
 */
export function billedQuizTokens(
  result: { text: string; tokens: number },
  prompt: string
): number {
  const outEst = estimateTokens(result.text);
  if (result.tokens > outEst + 250) return result.tokens;
  return estimateTokens(prompt) + Math.max(result.tokens, outEst);
}
