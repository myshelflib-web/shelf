import type { PreparedPageAsk } from "./pageAskPrepare.js";
import { studyToolsForRequest } from "./studyToolFilter.js";

/** Quick = legacy fast path (default model + token cap). Standard/Deep pass depth LLM opts. */
export function studyToolLoopOpts(
  prepared: Pick<
    PreparedPageAsk,
    "depth" | "depthConfig" | "toolsEnabled" | "webSearchEnabled" | "user"
  >,
  signal?: AbortSignal
): {
  enabled: boolean;
  signal?: AbortSignal;
  tools: ReturnType<typeof studyToolsForRequest>;
  llm?: {
    model: string;
    maxTokens: number;
    temperature: number;
  };
  maxToolRounds?: number;
} {
  const tools = studyToolsForRequest({
    webSearch: prepared.webSearchEnabled,
    studyGoal: prepared.user?.studyGoal,
  });
  const base = { enabled: prepared.toolsEnabled, signal, tools };
  if (prepared.depth === "quick") {
    return {
      ...base,
      maxToolRounds: prepared.webSearchEnabled ? 2 : undefined,
    };
  }
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
