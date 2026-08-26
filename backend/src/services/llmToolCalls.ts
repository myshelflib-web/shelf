import type { ChatToolCall, GoogleToolExtraContent } from "./llmTypes.js";

/** Last-resort dummy when Gemini required a signature we never received. */
export const SKIP_THOUGHT_SIGNATURE = "skip_thought_signature_validator";

export type ToolCallAcc = {
  id: string;
  name: string;
  arguments: string;
  extra_content?: GoogleToolExtraContent;
};

export function extraContentFromUnknown(
  raw: unknown
): GoogleToolExtraContent | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const google = (raw as { google?: { thought_signature?: unknown } }).google;
  const sig = google?.thought_signature;
  if (typeof sig !== "string" || !sig) return undefined;
  return { google: { thought_signature: sig } };
}

export function readToolCalls(raw: unknown): ChatToolCall[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const calls: ChatToolCall[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as {
      id?: string;
      type?: string;
      function?: { name?: string; arguments?: string };
      extra_content?: unknown;
    };
    const name = rec.function?.name;
    if (!name) continue;
    const extra = extraContentFromUnknown(rec.extra_content);
    const call: ChatToolCall = {
      id: rec.id || `call_${calls.length}`,
      type: "function",
      function: {
        name,
        arguments:
          typeof rec.function?.arguments === "string"
            ? rec.function.arguments
            : "{}",
      },
    };
    if (extra) call.extra_content = extra;
    calls.push(call);
  }
  return calls.length ? ensureThoughtSignatures(calls) : undefined;
}

export function mergeToolCallDelta(
  acc: Map<number, ToolCallAcc>,
  raw: unknown
): void {
  if (!Array.isArray(raw)) return;
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as {
      index?: number;
      id?: string;
      function?: { name?: string; arguments?: string };
      extra_content?: unknown;
    };
    const index = typeof rec.index === "number" ? rec.index : acc.size;
    const prev = acc.get(index) ?? { id: "", name: "", arguments: "" };
    if (rec.id) prev.id = rec.id;
    if (rec.function?.name) prev.name += rec.function.name;
    if (typeof rec.function?.arguments === "string") {
      prev.arguments += rec.function.arguments;
    }
    const extra = extraContentFromUnknown(rec.extra_content);
    if (extra) prev.extra_content = extra;
    acc.set(index, prev);
  }
}

export function finalizeStreamToolCalls(
  acc: Map<number, ToolCallAcc>
): ChatToolCall[] {
  const calls: ChatToolCall[] = [...acc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, row], i) => {
      const call: ChatToolCall = {
        id: row.id || `call_${i}`,
        type: "function",
        function: { name: row.name, arguments: row.arguments || "{}" },
      };
      if (row.extra_content) call.extra_content = row.extra_content;
      return call;
    })
    .filter((c) => c.function.name);
  return calls.length ? ensureThoughtSignatures(calls) : [];
}

/** First function call in a Gemini 3 step must carry a thought_signature. */
export function ensureThoughtSignatures(calls: ChatToolCall[]): ChatToolCall[] {
  if (calls.length === 0) return calls;
  const first = calls[0];
  if (first.extra_content?.google?.thought_signature) return calls;
  return [
    {
      ...first,
      extra_content: { google: { thought_signature: SKIP_THOUGHT_SIGNATURE } },
    },
    ...calls.slice(1),
  ];
}
