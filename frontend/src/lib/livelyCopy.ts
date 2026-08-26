/**
 * Warm, calm copy pools so Shelf feels alive without noisy hype.
 * Picks are seeded (session + time slot) so lines change over the day
 * and when you move around the app, but stay stable for a short window.
 */

export type TimeBucket = "morning" | "afternoon" | "evening";

export type LivelySurface =
  | "library"
  | "libraryEmpty"
  | "studyAi"
  | "studyPanel"
  | "dashboard"
  | "calendar"
  | "planner"
  | "quiz"
  | "settings"
  | "profile"
  | "generic";

export function timeBucket(hour = new Date().getHours()): TimeBucket {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

/** Surface one-liners rotate often enough to feel alive. */
export const LIVELY_LINE_ROTATE_MS = 10_000;

/** Salutations rotate more slowly so the greeting stays calm. */
export const LIVELY_SALUTATION_ROTATE_MS = 40_000;

/** @deprecated prefer LIVELY_LINE_ROTATE_MS / LIVELY_SALUTATION_ROTATE_MS */
export const LIVELY_ROTATE_MS = LIVELY_LINE_ROTATE_MS;

const SALUTATIONS: Record<TimeBucket, string[]> = {
  morning: [
    "Good morning",
    "Morning",
    "Hello",
    "Rise gently",
    "Welcome back",
    "Fresh start",
  ],
  afternoon: [
    "Good afternoon",
    "Afternoon",
    "Hello again",
    "Hey",
    "Welcome back",
    "Still here",
  ],
  evening: [
    "Good evening",
    "Evening",
    "Hello",
    "Welcome back",
    "Winding down",
    "Nice to see you",
  ],
};

const SUBTITLES: Record<TimeBucket, string[]> = {
  morning: [
    "A quiet start — let’s ease into it.",
    "How are you today?",
    "One page at a time is enough.",
    "Coffee optional. Curiosity isn’t.",
    "Small wins stack up.",
    "Pick a corner of your notes and begin.",
  ],
  afternoon: [
    "Hope your day’s going well.",
    "A short stretch of focus goes far.",
    "What’s worth revising next?",
    "Keep the thread — you’re doing fine.",
    "Midday energy: use it kindly.",
    "Progress over perfection.",
  ],
  evening: [
    "How are you this evening?",
    "A calm close to the day.",
    "Review beats rush.",
    "Leave tomorrow a little clearer.",
    "Soft light, steady notes.",
    "You’ve shown up — that counts.",
  ],
};

const SURFACE_LINES: Record<LivelySurface, string[]> = {
  library: [
    "Search your collections, or open a page from the explorer.",
    "Your shelves are waiting — pick a thread.",
    "Browse, pin, and keep going where you left off.",
    "Every collection is a room you can return to.",
    "Find a page. Make a mark. Move on lightly.",
  ],
  libraryEmpty: [
    "Add a collection or page to start your library.",
    "Empty shelves mean room to grow — drop a PDF in.",
    "Your first collection is one click away.",
    "Start with one page. The rest will follow.",
    "A blank library is an invitation, not a gap.",
  ],
  studyAi: [
    "Ask anything — answers stay in your notes.",
    "Quiz yourself, or untangle a sticky chapter.",
    "Your notes remember; this helps you use them.",
    "Pick a suggestion, or type what’s on your mind.",
    "Grounded answers, tuned to how you study.",
  ],
  studyPanel: [
    "Ask about this file, or try a quick action below.",
    "Highlight a passage, then ask what it means.",
    "Summarize, map, or quiz — your call.",
    "This page is the focus; your library still informs the answer.",
    "Curious about a line? Send it here.",
  ],
  dashboard: [
    "Pick up where you left off.",
    "Search your notes, or jump back into a page.",
    "One next step is enough — then open the work.",
    "Continue, plan, or ask. Then back to the page.",
    "Your collections are waiting when you are.",
  ],
  calendar: [
    "Capture first. Put it on a day when you are ready.",
    "Drag work onto the week — unfinished stays in To plan.",
    "Tasks and events, side by side on the board.",
    "Weekly or monthly — same calm planner.",
    "Block time for what you mean to finish.",
  ],
  planner: [
    "Capture first. Put it on a day when you are ready.",
    "Drag work onto the week — unfinished stays in To plan.",
    "Tasks and events, side by side on the board.",
    "Weekly or monthly — same calm planner.",
    "Block time for what you mean to finish.",
  ],
  quiz: [
    "Exam-level questions from your notes — or the bank.",
    "Set difficulty and time. Then sit the paper.",
    "MCQ, written, or a photo of your working.",
    "If a syllabus is on, every stem maps to a heading.",
    "Same quiz chrome from Library, Study AI, or here.",
  ],
  settings: [
    "Tune the quiet parts: theme, goals, plan.",
    "Preferences that stay out of the way.",
    "Make Shelf fit how you study.",
  ],
  profile: [
    "Name, photo, and account — kept simple.",
    "You, behind the collections.",
  ],
  generic: [
    "One clear step at a time.",
    "Stay curious. Stay kind to yourself.",
    "You’re in the right place.",
  ],
};

export function hashSeed(...parts: Array<string | number>): number {
  let h = 2166136261;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickFromPool<T>(pool: readonly T[], seed: number): T {
  if (pool.length === 0) {
    throw new Error("empty pool");
  }
  return pool[seed % pool.length]!;
}

export function livelySlot(
  now = Date.now(),
  rotateMs = LIVELY_LINE_ROTATE_MS
): number {
  return Math.floor(now / rotateMs);
}

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function pickSalutation(
  opts: {
    hour?: number;
    sessionSeed?: string | number;
    slot?: number;
    day?: string;
  } = {}
): string {
  const bucket = timeBucket(opts.hour);
  const seed = hashSeed(
    "salutation",
    bucket,
    opts.day ?? dayKey(),
    opts.sessionSeed ?? "shelf",
    opts.slot ?? livelySlot(Date.now(), LIVELY_SALUTATION_ROTATE_MS)
  );
  return pickFromPool(SALUTATIONS[bucket], seed);
}

export function pickGreetingSubtitle(
  opts: {
    hour?: number;
    sessionSeed?: string | number;
    slot?: number;
    day?: string;
  } = {}
): string {
  const bucket = timeBucket(opts.hour);
  const seed = hashSeed(
    "subtitle",
    bucket,
    opts.day ?? dayKey(),
    opts.sessionSeed ?? "shelf",
    opts.slot ?? livelySlot(Date.now(), LIVELY_SALUTATION_ROTATE_MS)
  );
  return pickFromPool(SUBTITLES[bucket], seed);
}

export function pickSurfaceLine(
  surface: LivelySurface,
  opts: {
    sessionSeed?: string | number;
    slot?: number;
    day?: string;
    hour?: number;
    /** Offset so adjacent surfaces don’t echo the same vibe. */
    salt?: string;
  } = {}
): string {
  const pool = SURFACE_LINES[surface] ?? SURFACE_LINES.generic;
  const slot = opts.slot ?? livelySlot(Date.now(), LIVELY_LINE_ROTATE_MS);
  const bucket = timeBucket(opts.hour);
  // Walk the pool as slots advance so the line visibly changes over time.
  const offset = hashSeed(
    "surface",
    surface,
    bucket,
    opts.salt ?? "",
    opts.day ?? dayKey(),
    opts.sessionSeed ?? "shelf"
  );
  return pool[(offset + slot) % pool.length]!;
}

const SESSION_KEY = "shelf:lively-seed";

export function getOrCreateSessionSeed(): string {
  if (typeof sessionStorage === "undefined") return "ssr";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const next = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `mem-${Date.now()}`;
  }
}
