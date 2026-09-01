import { completeChat } from "../llm.js";
import { chatModel } from "../llmConfig.js";
import type { ChatMessage } from "../llmTypes.js";
import { sarvamChat } from "../sarvam/sarvamChat.js";
import { sarvamConfigured, sarvamModel } from "../sarvam/sarvamConfig.js";

export type GenerationProvider = "sarvam" | "shelf";

export type GenerationChatResult = {
  text: string;
  provider: GenerationProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export type GenerationUsage = {
  inputTokens: number;
  outputTokens: number;
};

export function emptyUsage(): GenerationUsage {
  return { inputTokens: 0, outputTokens: 0 };
}

export function addUsage(
  total: GenerationUsage,
  next: { inputTokens: number; outputTokens: number }
): GenerationUsage {
  return {
    inputTokens: total.inputTokens + next.inputTokens,
    outputTokens: total.outputTokens + next.outputTokens,
  };
}

/** Label stored on jobs so the dashboard shows what actually produced the text. */
export function generationModelLabel(): string {
  return sarvamConfigured()
    ? `sarvam/${sarvamModel()}`
    : `shelf/${chatModel()}`;
}

function approxTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Single entry point for content-generation prompts.
 * Uses Sarvam when SARVAM_API_KEY is set, otherwise the existing Shelf LLM
 * so the pipeline stays runnable before the key is injected.
 */
export async function generationChat(
  messages: ChatMessage[],
  opts: { maxTokens?: number; temperature?: number; metricsFlow?: string } = {}
): Promise<GenerationChatResult> {
  if (sarvamConfigured()) {
    const res = await sarvamChat(messages, {
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
    });
    return {
      text: res.text,
      provider: "sarvam",
      model: res.model,
      inputTokens: res.inputTokens,
      outputTokens: res.outputTokens,
    };
  }

  const res = await completeChat(messages, {
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    apiKeyRoute: "paid",
    metricsFlow: opts.metricsFlow ?? "content_gen",
  });

  const promptTokens = approxTokens(
    messages.map((m) => (typeof m.content === "string" ? m.content : "")).join("\n")
  );
  const outputTokens = approxTokens(res.text);

  return {
    text: res.text,
    provider: "shelf",
    model: chatModel(),
    inputTokens: res.tokens > outputTokens ? res.tokens - outputTokens : promptTokens,
    outputTokens,
  };
}
