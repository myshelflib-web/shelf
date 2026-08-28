import type { StudyDepth } from "./studyDepth.js";

type PageAskMode =
  | "ask"
  | "summarize"
  | "notes"
  | "mindmap"
  | "deep-summary"
  | "analyze";

/** Whether page-ask should hit Qdrant/embeddings before packing context. */
export function shouldRetrievePageVectors(opts: {
  pageId: string | null;
  forceVectors: boolean;
  depth: StudyDepth;
  hasSelection: boolean;
  thinText: boolean;
  fullFileText: string;
  resolvedMode: PageAskMode;
  mapReduceEligible: boolean;
}): boolean {
  if (!opts.pageId) return false;
  if (opts.mapReduceEligible) return false;
  if (opts.forceVectors || opts.thinText || opts.hasSelection) return true;

  const largeFile = opts.fullFileText.length >= 8_000;

  // Quick doc tools: pack from file text — skip the vector round-trip.
  if (
    opts.depth === "quick" &&
    largeFile &&
    opts.resolvedMode !== "ask"
  ) {
    return false;
  }

  if (!largeFile) return true;

  // Large file: Standard/Deep still retrieve; Quick ask uses targeted search only.
  return opts.depth !== "quick" || opts.resolvedMode === "ask";
}

export function pageAskRetrieveOpts(opts: {
  depth: StudyDepth;
  hasSelection: boolean;
  resolvedMode: PageAskMode;
  userQuestion: string;
  expandedPrompt: boolean;
}): {
  hasSelection: boolean;
  includeRelated: boolean;
  coverWholePage: boolean;
  questionFocused: boolean;
} {
  return {
    hasSelection: opts.hasSelection,
    includeRelated: process.env.PAGE_ASK_RELATED === "true",
    coverWholePage: opts.depth !== "quick" && !opts.hasSelection,
    questionFocused:
      opts.resolvedMode === "ask" &&
      Boolean(opts.userQuestion) &&
      !opts.expandedPrompt,
  };
}
