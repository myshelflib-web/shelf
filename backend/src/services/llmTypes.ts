export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ChatContentPart[] | null;
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
  name?: string;
};

export type ChatRequestOpts = {
  stream: boolean;
  tools?: ChatToolDef[];
  toolChoice?: "auto" | "none";
  signal?: AbortSignal;
};

export type ChatResult = {
  text: string;
  tokens: number;
  toolCalls?: ChatToolCall[];
};

export function isToolsUnsupportedMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("tool") &&
    (m.includes("unknown") ||
      m.includes("not supported") ||
      m.includes("unexpected") ||
      m.includes("invalid"))
  );
}
