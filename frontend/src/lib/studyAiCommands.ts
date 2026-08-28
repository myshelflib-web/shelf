export type StudyAiCommandScope = "library" | "page";

export type StudyAiPageMode = "summarize" | "notes" | "mindmap" | "deep-summary";

export type StudyAiCommand = {
  slash: string;
  name: string;
  description: string;
  /** Default prompt when the learner sends `/cmd` with no extra words. */
  prompt: (scope: StudyAiCommandScope, args: string) => string;
  pageMode?: StudyAiPageMode;
};

const fileOrLibrary = (scope: StudyAiCommandScope) =>
  scope === "page"
    ? "this file (and the highlight if one is present)"
    : "my library notes in the current chat scope";

function withTopic(base: string, args: string): string {
  const topic = args.trim();
  return topic ? `${base} Focus on: ${topic}.` : base;
}

export const STUDY_AI_COMMANDS: StudyAiCommand[] = [
  {
    slash: "summarize",
    name: "Summarize",
    description: "Revision recap with key points.",
    pageMode: "summarize",
    prompt: (scope, args) =>
      withTopic(
        `Summarize ${fileOrLibrary(scope)} for revision. Use ## Summary, ### Key points, and ### Recap.`,
        args
      ),
  },
  {
    slash: "deep-summary",
    name: "Deep summary",
    description: "Chapter-by-chapter thorough summary (use Deep mode).",
    pageMode: "deep-summary",
    prompt: (scope, args) =>
      withTopic(
        `Give a comprehensive deep summary of ${fileOrLibrary(scope)}. Use ## Deep summary, ### per chapter/section with detailed bullets, and ### Cross-cutting themes. Target 2,000+ words.`,
        args
      ),
  },
  {
    slash: "analyze",
    name: "Analyze",
    description: "Thorough thematic analysis with examples.",
    prompt: (scope, args) =>
      withTopic(
        `Provide a thorough thematic analysis of ${fileOrLibrary(scope)}: core arguments, evidence, implications, and gaps. Use ### per theme with examples.`,
        args
      ),
  },
  {
    slash: "chapter-notes",
    name: "Chapter notes",
    description: "Detailed notes with one section per chapter.",
    prompt: (scope, args) =>
      withTopic(
        `Create detailed chapter-wise notes from ${fileOrLibrary(scope)}. Use ## Chapter notes and ### per chapter with key terms, facts, and must-remember points.`,
        args
      ),
  },
  {
    slash: "mains",
    name: "Mains answer",
    description: "Long-form exam answer (UPSC mains style).",
    prompt: (scope, args) =>
      withTopic(
        `Write a long-form mains-style answer from ${fileOrLibrary(scope)} for my study track. Use introduction, structured body with ### headings, examples, and conclusion. Target 800–1,200 words.`,
        args
      ),
  },
  {
    slash: "notes",
    name: "Notes",
    description: "Short revision notes and must-remembers.",
    pageMode: "notes",
    prompt: (scope, args) =>
      withTopic(
        `Make short revision notes from ${fileOrLibrary(scope)}. Use ## Notes, ### Key terms, and ### Must remember.`,
        args
      ),
  },
  {
    slash: "mindmap",
    name: "Mind map",
    description: "Mermaid mind map of the topic.",
    pageMode: "mindmap",
    prompt: (scope, args) =>
      withTopic(
        `Create a Mermaid mind map for ${fileOrLibrary(scope)}. One fenced mermaid mindmap block, then a short ### Key takeaways list.`,
        args
      ),
  },
  {
    slash: "quiz",
    name: "Quiz",
    description: "Open an exam-style quiz on this scope.",
    prompt: (scope, args) =>
      withTopic(
        `Quiz me on ${fileOrLibrary(scope)}. Give 5 questions (mix of short and MCQ). After all questions, a blank line, then ### Answers with brief explanations. Match my exam track.`,
        args
      ),
  },
  {
    slash: "flashcards",
    name: "Flashcards",
    description: "Front/back recall cards.",
    prompt: (scope, args) =>
      withTopic(
        `Make 8 flashcards from ${fileOrLibrary(scope)}. Use this exact format for every card (no intro):\n\n### Card 1\n**Q:** …\n**A:** …\n\n### Card 2\n**Q:** …\n**A:** …\n\nHigh-yield only. Short fronts, precise backs.`,
        args
      ),
  },
  {
    slash: "explain",
    name: "Explain",
    description: "Clear structured explanation.",
    prompt: (scope, args) =>
      withTopic(
        `Explain ${fileOrLibrary(scope)} clearly. Definition, how it works, one example, recap.`,
        args
      ),
  },
  {
    slash: "eli5",
    name: "Simpler",
    description: "Same idea in simpler language.",
    prompt: (scope, args) =>
      withTopic(
        `Explain ${fileOrLibrary(scope)} in simpler language, then restore the precise exam terms in a short glossary.`,
        args
      ),
  },
  {
    slash: "define",
    name: "Define",
    description: "Key terms and distinctions.",
    prompt: (scope, args) =>
      withTopic(
        `Define the key terms in ${fileOrLibrary(scope)}. One-line definitions, then a table of easy confusions.`,
        args
      ),
  },
  {
    slash: "example",
    name: "Example",
    description: "Worked example or illustration.",
    prompt: (scope, args) =>
      withTopic(
        `Give a worked example or exam-style illustration from ${fileOrLibrary(scope)}. Number the steps.`,
        args
      ),
  },
  {
    slash: "compare",
    name: "Compare",
    description: "Table of similarities and differences.",
    prompt: (scope, args) =>
      withTopic(
        `Compare the main ideas in ${fileOrLibrary(scope)} in a Markdown table (aspect | A | B), then a one-line takeaway.`,
        args
      ),
  },
  {
    slash: "pyq",
    name: "PYQ drill",
    description: "Exam-style practice (no invented paper years).",
    prompt: (scope, args) =>
      withTopic(
        `Write a PYQ-style drill from ${fileOrLibrary(scope)} for my study track. If a real past-paper year is not in the notes, label items Practice — never invent year/paper. Then sketch a model answer.`,
        args
      ),
  },
  {
    slash: "plan",
    name: "Plan",
    description: "Short revision plan.",
    prompt: (scope, args) =>
      withTopic(
        `Make a realistic revision plan from ${fileOrLibrary(scope)} for the next few sessions. Time-boxed bullets.`,
        args
      ),
  },
  {
    slash: "recap",
    name: "Recap",
    description: "Quick close-the-loop recap.",
    prompt: (scope, args) =>
      withTopic(
        `Give a tight recap of ${fileOrLibrary(scope)}: 5 bullets + one trap to avoid.`,
        args
      ),
  },
  {
    slash: "outline",
    name: "Outline",
    description: "Answer skeleton / headings.",
    prompt: (scope, args) =>
      withTopic(
        `Outline an exam answer from ${fileOrLibrary(scope)}: headings only, then 2–3 points under each. Match my track's word/marks habits.`,
        args
      ),
  },
  {
    slash: "gaps",
    name: "Syllabus gaps",
    description: "What’s missing vs the attached syllabus.",
    prompt: (scope, args) =>
      withTopic(
        `Compare ${fileOrLibrary(scope)} to my attached syllabus / relevancy doc (or the official track syllabus if none). List covered vs gaps. Do not invent PYQs.`,
        args
      ),
  },
  {
    slash: "mnemonic",
    name: "Mnemonic",
    description: "Memory aid for lists and steps.",
    prompt: (scope, args) =>
      withTopic(
        `Create a mnemonic or memory palace for the hardest list in ${fileOrLibrary(scope)}. Keep it clean and exam-usable.`,
        args
      ),
  },
  {
    slash: "formula",
    name: "Formulas",
    description: "Key formulae with conditions.",
    prompt: (scope, args) =>
      withTopic(
        `Extract key formulas or legal/clinical rules from ${fileOrLibrary(scope)}. Define symbols, state assumptions, note a common trap.`,
        args
      ),
  },
  {
    slash: "timeline",
    name: "Timeline",
    description: "Chronology or sequence.",
    prompt: (scope, args) =>
      withTopic(
        `Make a timeline or process sequence from ${fileOrLibrary(scope)}. Dates or steps only if they are in the material.`,
        args
      ),
  },
  {
    slash: "cite",
    name: "Cite",
    description: "Answer only from library excerpts with citations.",
    prompt: (scope, args) =>
      withTopic(
        `Answer from ${fileOrLibrary(scope)} only. Cite [1], [2]. If the notes are thin, say so under ### Gaps.`,
        args
      ),
  },
  {
    slash: "help",
    name: "Commands",
    description: "Show every slash command.",
    prompt: () => "/help",
  },
];

export function commandBySlash(slash: string): StudyAiCommand | undefined {
  const key = slash.replace(/^\//, "").trim().toLowerCase();
  return STUDY_AI_COMMANDS.find((c) => c.slash === key);
}

export function parseSlashInput(raw: string): {
  slash: string;
  args: string;
} | null {
  const text = raw.trim();
  if (!text.startsWith("/")) return null;
  const m = text.match(/^\/([a-z][\w-]*)(?:\s+([\s\S]*))?$/i);
  if (!m) return null;
  return { slash: m[1].toLowerCase(), args: (m[2] ?? "").trim() };
}

/** True while the composer is a slash token (`/` or `/quiz`) with no arguments yet. */
export function isSlashMenuQuery(raw: string): boolean {
  const t = raw.trim();
  if (t === "/") return true;
  return /^\/[a-z][\w-]*$/i.test(t);
}

export function filterCommands(query: string): StudyAiCommand[] {
  const q = query.replace(/^\//, "").trim().toLowerCase();
  if (!q) return STUDY_AI_COMMANDS.filter((c) => c.slash !== "help");
  return STUDY_AI_COMMANDS.filter(
    (c) =>
      c.slash.includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}

export type ResolvedStudyAiInput =
  | { kind: "help" }
  | { kind: "mode"; mode: StudyAiPageMode }
  | { kind: "quiz"; topic: string }
  | { kind: "prompt"; text: string; display: string }
  | { kind: "plain"; text: string };

function slashDisplay(slash: string, args: string): string {
  const a = args.trim();
  return a ? `/${slash} ${a}` : `/${slash}`;
}

/** If `raw` is a known expanded command template, return its slash label. */
export function slashLabelForExpandedPrompt(
  raw: string,
  scope: StudyAiCommandScope
): string | null {
  const text = raw.trim();
  if (!text || text.startsWith("/")) return null;
  for (const cmd of STUDY_AI_COMMANDS) {
    if (cmd.slash === "help") continue;
    if (cmd.prompt(scope, "") === text) return `/${cmd.slash}`;
  }
  return null;
}

export function resolveStudyAiInput(
  raw: string,
  scope: StudyAiCommandScope
): ResolvedStudyAiInput {
  const parsed = parseSlashInput(raw);
  if (!parsed) return { kind: "plain", text: raw };
  const cmd = commandBySlash(parsed.slash);
  if (!cmd) return { kind: "plain", text: raw };
  if (cmd.slash === "help") return { kind: "help" };
  if (cmd.slash === "quiz") return { kind: "quiz", topic: parsed.args };
  if (cmd.pageMode && scope === "page" && !parsed.args) {
    return { kind: "mode", mode: cmd.pageMode };
  }
  return {
    kind: "prompt",
    text: cmd.prompt(scope, parsed.args),
    display: slashDisplay(cmd.slash, parsed.args),
  };
}

import { slashInsertForSuggestLabel } from "@/lib/studyAiSuggestions";

/**
 * What to show in the bubble vs what the model receives.
 * Never returns an internal command template as `display`.
 */
export function studyAiSendParts(
  raw: string,
  scope: StudyAiCommandScope,
  opts?: { label?: string }
):
  | { kind: "help" }
  | { kind: "mode"; mode: StudyAiPageMode }
  | { kind: "quiz"; topic: string }
  | { kind: "send"; display: string; prompt: string } {
  const trimmed = raw.trim();
  const label = opts?.label?.trim();

  const fromChipLabel = !trimmed.startsWith("/")
    ? slashInsertForSuggestLabel(trimmed)
    : null;
  if (fromChipLabel && !label) {
    return studyAiSendParts(fromChipLabel, scope, { label: trimmed });
  }

  const resolved = resolveStudyAiInput(trimmed, scope);
  if (resolved.kind === "help") return { kind: "help" };
  if (resolved.kind === "quiz") return { kind: "quiz", topic: resolved.topic };
  if (resolved.kind === "mode") return { kind: "mode", mode: resolved.mode };
  if (resolved.kind === "prompt") {
    return {
      kind: "send",
      display: label || resolved.display,
      prompt: resolved.text,
    };
  }
  const collapsed = slashLabelForExpandedPrompt(trimmed, scope);
  if (collapsed) {
    const again = resolveStudyAiInput(collapsed, scope);
    const prompt = again.kind === "prompt" ? again.text : trimmed;
    return {
      kind: "send",
      display: label || collapsed,
      prompt,
    };
  }
  return {
    kind: "send",
    display: label || trimmed,
    prompt: trimmed,
  };
}
