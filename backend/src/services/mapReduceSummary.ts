import { truncateText } from "../utils/htmlText.js";
import { completeChat, streamChat } from "./llm.js";
import { studyDepthConfig, type StudyDepth } from "./studyDepth.js";

const SECTION_TARGET = 4_500;
const MAP_MAX_TOKENS = 1_024;

/** Split long plain text into section-sized chunks on paragraph boundaries. */
export function splitIntoSections(text: string, target = SECTION_TARGET): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= target) return [trimmed];

  const chunks: string[] = [];
  let start = 0;
  while (start < trimmed.length) {
    let end = Math.min(start + target, trimmed.length);
    if (end < trimmed.length) {
      const slice = trimmed.slice(start, end);
      const breakAt = Math.max(slice.lastIndexOf("\n\n"), slice.lastIndexOf(". "));
      if (breakAt > target * 0.45) end = start + breakAt + 1;
    }
    const piece = trimmed.slice(start, end).trim();
    if (piece) chunks.push(piece);
    start = Math.max(start + 1, end);
  }
  return chunks;
}

export type MapReduceOpts = {
  depth: StudyDepth;
  title: string;
  mode: string;
  sections: string[];
  systemPrompt: string;
  mergeInstruction: string;
  signal?: AbortSignal;
};

export type MapReduceStreamEvent =
  | { type: "status"; detail: string }
  | { type: "delta"; text: string }
  | { type: "done"; tokens: number; model: string };

function mapModel(): string {
  return process.env.LLM_MODEL_FAST?.trim() || "gemini-flash-lite-latest";
}

function sectionMapPrompt(title: string, section: string, i: number, total: number): string {
  return `Summarize this section of "${title}" for a comprehensive revision guide.
Include key terms, facts, arguments, examples, and definitions. Be thorough — do not omit important points.

Section ${i + 1} of ${total}:
${truncateText(section, 14_000)}`;
}

/** Map sections in parallel batches, then stream a merged deep answer. */
export async function* streamMapReduceAnswer(
  opts: MapReduceOpts
): AsyncGenerator<MapReduceStreamEvent> {
  const cfg = studyDepthConfig(opts.depth);
  const sections = opts.sections.filter((s) => s.trim());
  if (sections.length === 0) {
    throw new Error("No document sections to summarize.");
  }

  let tokens = 0;
  const mapSummaries: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    if (opts.signal?.aborted) break;
    const detail = `Reading section ${i + 1} of ${sections.length}…`;
    yield { type: "status", detail };

    const result = await completeChat(
      [
        {
          role: "system",
          content:
            "You summarize document sections for later merging. Output Markdown with bullets and short paragraphs. Cover every important point.",
        },
        {
          role: "user",
          content: sectionMapPrompt(opts.title, sections[i], i, sections.length),
        },
      ],
      {
        model: mapModel(),
        maxTokens: MAP_MAX_TOKENS,
        signal: opts.signal,
        temperature: 0.2,
      }
    );
    tokens += result.tokens;
    mapSummaries.push(`### Part ${i + 1}\n${result.text}`);
  }

  if (opts.signal?.aborted) {
    yield { type: "done", tokens, model: cfg.model };
    return;
  }

  yield { type: "status", detail: "Synthesizing full analysis…" };

  const mergeUser = `${opts.mergeInstruction}

Document: ${opts.title}
Section summaries (${sections.length} parts):

${mapSummaries.join("\n\n")}`;

  let model = cfg.model;
  for await (const ev of streamChat(
    [
      { role: "system", content: opts.systemPrompt },
      { role: "user", content: mergeUser },
    ],
    {
      model: cfg.model,
      maxTokens: cfg.maxTokens,
      temperature: cfg.temperature,
      signal: opts.signal,
    }
  )) {
    if (ev.type === "delta") {
      yield { type: "delta", text: ev.text };
    } else if (ev.type === "done") {
      tokens += ev.tokens;
      model = ev.model;
      yield { type: "done", tokens, model };
    }
  }
}
