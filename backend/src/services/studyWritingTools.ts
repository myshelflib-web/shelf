import type { ChatToolDef } from "./llmTypes.js";
import { assertLlmBudget, chargeLlmTokens } from "../utils/llmUsage.js";
import {
  checkLibraryOverlap,
  checkSyllabusOverlap,
} from "./originalityCheck.js";
import { paraphraseText, type ParaphraseStyle } from "./writingAssist.js";
import type { StudyToolContext, StudyToolResult } from "./studyToolTypes.js";

export const STUDY_WRITING_TOOLS: ChatToolDef[] = [
  {
    type: "function",
    function: {
      name: "paraphrase_text",
      description:
        "Rewrite a passage for the learner (paraphrase, simplify, formal, or shorten). Use when they ask to rephrase or rewrite text.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The passage to rewrite.",
          },
          style: {
            type: "string",
            description:
              "paraphrase | simplify | formal | shorten (default paraphrase).",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_library_overlap",
      description:
        "Flag close matches of a passage against the learner's own Shelf library (self-similarity). Not a web plagiarism scan. Use when they ask if text overlaps their notes.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Passage to check.",
          },
          excludePageId: {
            type: "string",
            description: "Optional page UUID to exclude (usually the open file).",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_syllabus_overlap",
      description:
        "Compare a passage to the learner's saved syllabus / relevancy docs for wording overlap.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Passage to check." },
        },
        required: ["text"],
      },
    },
  },
];

const STYLES = new Set<ParaphraseStyle>([
  "paraphrase",
  "simplify",
  "formal",
  "shorten",
]);

export async function executeStudyWritingTool(
  name: string,
  args: Record<string, unknown>,
  ctx: StudyToolContext
): Promise<StudyToolResult | null> {
  if (name === "paraphrase_text") {
    const text = String(args.text ?? "").trim();
    if (text.length < 12) return { text: "paraphrase_text needs a longer passage." };
    const styleRaw = String(args.style ?? "paraphrase").trim() as ParaphraseStyle;
    const style = STYLES.has(styleRaw) ? styleRaw : "paraphrase";
    try {
      await assertLlmBudget(ctx.userId, 1);
      const result = await paraphraseText(ctx.userId, text, style);
      await chargeLlmTokens(ctx.userId, result.tokens);
      const lines = result.variants.map((v, i) => `### Variant ${i + 1}\n${v}`);
      return {
        text: `Rewrites (${result.style}):\n\n${lines.join("\n\n")}`,
      };
    } catch (err) {
      return {
        text:
          err instanceof Error
            ? err.message
            : "Paraphrase failed. Try a shorter passage.",
      };
    }
  }

  if (name === "check_library_overlap") {
    const text = String(args.text ?? "").trim();
    if (text.length < 24) {
      return { text: "check_library_overlap needs a longer passage." };
    }
    const excludePageId =
      String(args.excludePageId ?? "").trim() ||
      ctx.defaultPageId ||
      null;
    const result = await checkLibraryOverlap(ctx.userId, text, {
      excludePageId,
      pageIds: ctx.pageIds,
    });
    if (result.matches.length === 0) {
      return { text: result.note };
    }
    const lines = result.matches.map(
      (m, i) =>
        `${i + 1}. [${m.severity}] ${m.title} (${m.notebook}${
          m.topic ? ` / ${m.topic}` : ""
        }) score=${m.score}\n   ${m.quote}\n   ${m.href}`
    );
    return {
      text: `${result.note}\n\n${lines.join("\n")}`,
      excerpts: result.matches.map((m) => ({
        pageId: m.pageId,
        title: m.title,
        notebook: m.notebook,
        topic: m.topic,
        href: m.href,
        text: m.quote,
        score: m.score,
      })),
    };
  }

  if (name === "check_syllabus_overlap") {
    const text = String(args.text ?? "").trim();
    if (text.length < 24) {
      return { text: "check_syllabus_overlap needs a longer passage." };
    }
    const result = await checkSyllabusOverlap(ctx.userId, text);
    if (result.overlaps.length === 0) return { text: result.note };
    const lines = result.overlaps.map(
      (o, i) =>
        `${i + 1}. ${o.title} (${o.source}) score=${o.score}\n   ${o.excerpt}`
    );
    return { text: `${result.note}\n\n${lines.join("\n")}` };
  }

  return null;
}

export function writingToolStatusDetail(
  name: string,
  _args: Record<string, unknown>
): string | null {
  switch (name) {
    case "paraphrase_text":
      return "Rewriting passage";
    case "check_library_overlap":
      return "Checking library overlap";
    case "check_syllabus_overlap":
      return "Checking syllabus overlap";
    default:
      return null;
  }
}
