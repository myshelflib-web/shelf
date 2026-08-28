import type { PreparedPageAsk } from "../services/pageAskPrepare.js";
import { streamMapReduceAnswer } from "../services/mapReduceSummary.js";
import { streamWithStudyTools } from "../services/studyToolLoop.js";
import { logger, errorFields } from "../utils/logger.js";

export type StudyAskStreamEvent =
  | { type: "status"; stage: string; detail: string }
  | { type: "delta"; text: string };

/** Stream map-reduce or single-pass Study AI answer; map-reduce falls back on failure. */
export async function runStudyAskStream(
  opts: {
    prepared: PreparedPageAsk;
    userId: string;
    signal?: AbortSignal;
  },
  onEvent: (ev: StudyAskStreamEvent) => void
): Promise<{ answer: string; tokens: number }> {
  const { prepared, userId, signal } = opts;
  let tokens = 0;
  let answer = "";

  const toolOpts = {
    enabled: prepared.toolsEnabled,
    llm: {
      model: prepared.depthConfig.model,
      maxTokens: prepared.depthConfig.maxTokens,
      temperature: prepared.depthConfig.temperature,
    },
    maxToolRounds: prepared.depthConfig.toolRounds,
    signal,
  };

  const consumeToolStream = async () => {
    for await (const ev of streamWithStudyTools(
      prepared.chatMessages,
      {
        userId,
        defaultPageId: prepared.defaultPageId,
      },
      toolOpts
    )) {
      if (ev.type === "status") {
        onEvent({ type: "status", stage: "tools", detail: ev.detail });
      } else if (ev.type === "delta") {
        answer += ev.text;
        onEvent({ type: "delta", text: ev.text });
      } else if (ev.type === "done") {
        tokens = ev.tokens;
        onEvent({
          type: "status",
          stage: "finishing",
          detail: ev.model ? `Done · ${ev.model}` : "Done",
        });
      }
    }
  };

  if (prepared.useMapReduce && prepared.mapReduceSections.length > 0) {
    try {
      for await (const ev of streamMapReduceAnswer({
        depth: prepared.depth,
        title: prepared.title,
        mode: prepared.resolvedMode,
        sections: prepared.mapReduceSections,
        systemPrompt: prepared.systemPrompt,
        mergeInstruction: prepared.mergeInstruction,
        signal,
      })) {
        if (ev.type === "status") {
          onEvent({ type: "status", stage: "map_reduce", detail: ev.detail });
        } else if (ev.type === "delta") {
          answer += ev.text;
          onEvent({ type: "delta", text: ev.text });
        } else if (ev.type === "done") {
          tokens = ev.tokens;
          onEvent({
            type: "status",
            stage: "finishing",
            detail: ev.model ? `Done · ${ev.model}` : "Done",
          });
        }
      }
    } catch (mapErr) {
      logger.warn("study.map_reduce.fallback", errorFields(mapErr));
      answer = "";
      onEvent({
        type: "status",
        stage: "generating",
        detail: "Switched to single-pass answer…",
      });
      await consumeToolStream();
    }
  } else {
    await consumeToolStream();
  }

  return { answer, tokens };
}
