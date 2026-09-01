import type { ChatMessage } from "../llmTypes.js";

/** Sarvam 105B thinking. `null` means off — do not send `reasoning_effort`. */
export type SarvamReasoningEffort = "low" | "medium" | "high" | null;

const thinkingKwargs = (on: boolean) => ({ enable_thinking: on });

/**
 * 105B thinks by default. JSON `reasoning_effort: null` is not the same as
 * Python `None` (the SDK omits the key). Null is treated as "use default",
 * which is thinking on — that is how we got 76k reasoning chars and an empty
 * `content`. Omit the key and send `enable_thinking: false` instead.
 */
export function sarvamCompletionPayload(opts: {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  reasoningEffort: SarvamReasoningEffort;
}): Record<string, unknown> {
  const thinkingOn = opts.reasoningEffort !== null;
  const kwargs = thinkingKwargs(thinkingOn);
  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature,
    max_tokens: opts.maxTokens,
    stream: false,
    chat_template_kwargs: kwargs,
    extra_body: { chat_template_kwargs: kwargs },
  };
  if (thinkingOn) body.reasoning_effort = opts.reasoningEffort;
  return body;
}

export function sarvamAuthHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "api-subscription-key": apiKey,
    "Content-Type": "application/json",
  };
}
