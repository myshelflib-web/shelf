export type StudyDepth = "quick" | "standard" | "deep";

const STORAGE_KEY = "shelf:study-depth";

export const STUDY_DEPTH_OPTIONS: {
  id: StudyDepth;
  label: string;
  hint: string;
  premium?: boolean;
}[] = [
  { id: "quick", label: "Quick", hint: "Fastest — flash-lite, minimal prep" },
  { id: "standard", label: "Standard", hint: "More detail; slower model" },
  {
    id: "deep",
    label: "Deep",
    hint: "Think longer — full book synthesis (Premium)",
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
