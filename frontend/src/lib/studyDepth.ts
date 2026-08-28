export type StudyDepth = "quick" | "standard" | "deep";

const STORAGE_KEY = "shelf:study-depth";

export const STUDY_DEPTH_OPTIONS: {
  id: StudyDepth;
  label: string;
  hint: string;
  premium?: boolean;
}[] = [
  { id: "quick", label: "Quick", hint: "Fast, concise answers" },
  { id: "standard", label: "Standard", hint: "More detail and context" },
  {
    id: "deep",
    label: "Deep",
    hint: "Think longer — section-by-section on big PDFs",
    premium: true,
  },
];

export function parseStudyDepth(raw: unknown): StudyDepth {
  if (raw === "standard" || raw === "deep") return raw;
  return "quick";
}

export function getStoredStudyDepth(): StudyDepth {
  if (typeof window === "undefined") return "quick";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return parseStudyDepth(v);
  } catch {
    return "quick";
  }
}

export function setStoredStudyDepth(depth: StudyDepth): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, depth);
  } catch {
    /* ignore */
  }
}

export function depthLabel(depth: StudyDepth): string {
  return STUDY_DEPTH_OPTIONS.find((o) => o.id === depth)?.label ?? "Quick";
}
