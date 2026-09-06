export type ParaphraseStyle =
  | "paraphrase"
  | "simplify"
  | "formal"
  | "shorten";

export type OriginalityMatch = {
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  quote: string;
  score: number;
  severity: "high" | "medium" | "low";
};

export type SyllabusOverlap = {
  docId: string;
  title: string;
  source: string;
  excerpt: string;
  score: number;
};

export type OriginalityReport = {
  library: {
    kind: "library";
    matches: OriginalityMatch[];
    indexed: boolean;
    note: string;
  };
  syllabus: {
    kind: "syllabus";
    overlaps: SyllabusOverlap[];
    note: string;
  };
  web: {
    kind: "web";
    status: "premium_required" | "coming_soon" | "ok" | "error" | "pending";
    message: string;
    matches?: Array<{ url: string; score: number; excerpt?: string }>;
    scorePercent?: number | null;
    scanId?: string;
    upgradeUrl?: string;
  };
  aiHeuristic?: {
    kind: "ai_heuristic";
    likelihood: "low" | "medium" | "high" | "unknown";
    score: number;
    summary: string;
    signals: string[];
    disclaimer: string;
  };
};

export type WritingAssistOpen =
  | {
      mode: "paraphrase";
      text: string;
      pageId?: string;
      onInsert?: (text: string) => void;
    }
  | {
      mode: "originality";
      text: string;
      pageId?: string;
      includeAiHeuristic?: boolean;
    };
