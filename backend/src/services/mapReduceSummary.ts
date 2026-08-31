import { truncateText } from "../utils/htmlText.js";
import { completeChat, streamChat } from "./llm.js";
import { SHELF_GEMINI } from "./shelfGeminiModels.js";
import { studyDepthConfig, type StudyDepth } from "./studyDepth.js";

const SECTION_TARGET = 4_500;
const MAP_MAX_TOKENS = 640;
/** Cap section map calls so a whole textbook cannot stall or trip rate limits. */
export const MAX_MAP_REDUCE_SECTIONS = 10;

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
  return process.env.LLM_MODEL_MAP?.trim() || SHELF_GEMINI.FAST;
}

/** Evenly sample sections across the document when there are too many chunks. */
function sampleSections(sections: string[], max: number): string[] {
  if (sections.length <= max) return sections;
  const out: string[] = [];
  for (let i = 0; i < max; i++) {
    const idx = Math.floor((i * sections.length) / max);
    out.push(sections[idx]);
  }
  return out;
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
  const all = opts.sections.filter((s) => s.trim());
  if (all.length === 0) {
    throw new Error("No document sections to summarize.");
  }
  const sections =
    all.length <= MAX_MAP_REDUCE_SECTIONS
      ? all
      : sampleSections(all, MAX_MAP_REDUCE_SECTIONS);

  let tokens = 0;
  const mapSummaries: string[] = [];
  const MAP_BATCH = 4;

  for (let start = 0; start < sections.length; start += MAP_BATCH) {
    if (opts.signal?.aborted) break;
    const batch = sections.slice(start, start + MAP_BATCH);
    const batchResults = await Promise.all(
      batch.map(async (section, batchIdx) => {
        const i = start + batchIdx;
        const result = await completeChat(
          [
            {
              role: "system",
              content:
                "You summarize document sections for later merging. Output Markdown with bullets and short paragraphs. Cover every important point.",
            },
            {
              role: "user",
              content: sectionMapPrompt(opts.title, section, i, sections.length),
            },
          ],
          {
            model: mapModel(),
            maxTokens: MAP_MAX_TOKENS,
            signal: opts.signal,
            temperature: 0.2,
            apiKeyRoute: "paid",
            metricsFlow: "study_map_reduce",
          }
        );
        return { i, text: result.text, tokens: result.tokens };
      })
    );
    for (const row of batchResults.sort((a, b) => a.i - b.i)) {
      tokens += row.tokens;
      mapSummaries[row.i] = `### Part ${row.i + 1}\n${row.text}`;
      yield {
        type: "status",
        detail: `Reading section ${row.i + 1} of ${sections.length}…`,
      };
    }
  }

  if (opts.signal?.aborted) {
    yield { type: "done", tokens, model: cfg.model };
    return;
  }

  yield { type: "status", detail: "Synthesizing full analysis…" };

  const mergeUser = `${opts.mergeInstruction}

Document: ${opts.title}
Section summaries (${sections.length} parts):

${mapSummaries.filter(Boolean).join("\n\n")}`;

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
      apiKeyRoute: "paid",
      metricsFlow: "study_map_reduce",
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
