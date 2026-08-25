export type TimeBucket = "morning" | "afternoon" | "evening";

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
    "A quiet start — let's ease into it.",
    "How are you today?",
    "One page at a time is enough.",
    "Small wins stack up.",
    "Pick a corner of your notes and begin.",
  ],
  afternoon: [
    "Hope your day's going well.",
    "A short stretch of focus goes far.",
    "What's worth revising next?",
    "Keep the thread — you're doing fine.",
    "Progress over perfection.",
  ],
  evening: [
    "How are you this evening?",
    "A calm close to the day.",
    "Review beats rush.",
    "Leave tomorrow a little clearer.",
    "You've shown up — that counts.",
  ],
};

export function timeBucket(hour = new Date().getHours()): TimeBucket {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getDisplayFirstName(name: string, maxNameLength = 16): string {
  const first = name.trim().split(/\s+/)[0];
  if (!first) return "there";
  return first.length > maxNameLength
    ? `${first.slice(0, maxNameLength - 1)}…`
    : first;
}

function pickFromPool<T>(pool: T[], seed: number): T {
  return pool[Math.abs(seed) % pool.length]!;
}

export function pickEmailSalutation(hour = new Date().getHours()): string {
  const bucket = timeBucket(hour);
  return pickFromPool(SALUTATIONS[bucket], hour + bucket.length);
}

export function pickEmailSubtitle(hour = new Date().getHours()): string {
  const bucket = timeBucket(hour);
  return pickFromPool(SUBTITLES[bucket], hour + 7);
}

export function getEmailGreetingParts(name?: string, hour = new Date().getHours()) {
  const firstName = name?.trim() ? getDisplayFirstName(name) : "there";
  return {
    salutation: pickEmailSalutation(hour),
    firstName,
    subtitle: pickEmailSubtitle(hour),
  };
}
