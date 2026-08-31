import type { PreparedPageAsk } from "../services/pageAskPrepare.js";
import { streamMapReduceAnswer } from "../services/mapReduceSummary.js";
import { streamWithStudyTools } from "../services/studyToolLoop.js";
import { studyToolLoopOpts } from "../services/studyToolOpts.js";
import { errorFields, logger } from "../utils/logger.js";
import { studyFlow } from "../utils/flowLog.js";

function finishingDetail(model?: string, answer?: string): string | null {
  if (!answer?.trim()) return null;
  return model ? `Done · ${model}` : "Done";
}

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

  studyFlow.streamStart(logger, {
    userId,
    mode: prepared.resolvedMode,
    depth: prepared.depth,
    mapReduce: prepared.useMapReduce,
    toolsEnabled: prepared.toolsEnabled,
  });

  const toolOpts = studyToolLoopOpts(prepared, signal);

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
        if (!answer.trim() && ev.answer?.trim()) {
          answer = ev.answer;
          onEvent({ type: "delta", text: ev.answer });
        }
        const detail = finishingDetail(ev.model, answer);
        if (detail) {
          onEvent({ type: "status", stage: "finishing", detail });
        }
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
          const detail = finishingDetail(ev.model, answer);
          if (detail) {
            onEvent({ type: "status", stage: "finishing", detail });
          }
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

  studyFlow.streamOk(logger, {
    userId,
    tokens,
    answerChars: answer.length,
    mode: prepared.resolvedMode,
  });

  return { answer, tokens };
}
