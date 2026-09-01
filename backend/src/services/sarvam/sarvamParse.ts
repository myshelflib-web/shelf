type ContentPart = { type?: string; text?: string };

type CompletionChoice = {
  finish_reason?: string | null;
  text?: string | null;
  message?: {
    content?: string | ContentPart[] | null;
    reasoning_content?: string | null;
  };
};

export type SarvamCompletionBody = {
  choices?: CompletionChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function fromParts(parts: ContentPart[]): string {
  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function fromContent(content: string | ContentPart[] | null | undefined): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return fromParts(content);
  return "";
}

/** Pulls the user-visible reply out of an OpenAI-shaped Sarvam body. */
export function extractCompletionText(body: SarvamCompletionBody): {
  text: string;
  finishReason: string | null;
  reasoningChars: number;
} {
  const choice = body.choices?.[0];
  const message = choice?.message;
  const text =
    fromContent(message?.content) ||
    (typeof choice?.text === "string" ? choice.text.trim() : "");

  return {
    text,
    finishReason: typeof choice?.finish_reason === "string" ? choice.finish_reason : null,
    reasoningChars: message?.reasoning_content?.length ?? 0,
  };
}
