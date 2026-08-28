import type { PreparedPageAsk } from "./pageAskPrepare.js";

/** Quick = legacy fast path (default model + token cap). Standard/Deep pass depth LLM opts. */
export function studyToolLoopOpts(
  prepared: Pick<PreparedPageAsk, "depth" | "depthConfig" | "toolsEnabled">,
  signal?: AbortSignal
): {
  enabled: boolean;
  signal?: AbortSignal;
  llm?: {
    model: string;
    maxTokens: number;
    temperature: number;
  };
  maxToolRounds?: number;
} {
  const base = { enabled: prepared.toolsEnabled, signal };
  if (prepared.depth === "quick") return base;
  return {
    ...base,
    llm: {
      model: prepared.depthConfig.model,
      maxTokens: prepared.depthConfig.maxTokens,
      temperature: prepared.depthConfig.temperature,
    },
    maxToolRounds: prepared.depthConfig.toolRounds,
  };
}
