import type { FeatureCategory } from "./featureTypes";

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "library",
    label: "Library & reader",
    description:
      "All-in-one study library: store PDFs, notes, and YouTube; highlight; write Docs; tabs and split view.",
  },
  {
    id: "study-ai",
    label: "Study AI",
    description:
      "Students ask an LLM grounded in uploads — Study AI on a highlight, page, or whole library. Paraphrase and originality included.",
  },
  {
    id: "practice",
    label: "Practice & planning",
    description:
      "Teacher test prep and student quizzes, a revision calendar, and a dashboard that tracks reading habits.",
  },
  {
    id: "integrations",
    label: "Integrations",
    description:
      "Import PDFs from Telegram and send them back, bring YouTube lectures into your library, play Spotify beside your reader, and share documents with classmates.",
  },
  {
    id: "platform",
    label: "Platform",
    description:
      "Offline PWA, cross-device sync, keyboard shortcuts, free curriculum, and Premium plans.",
  },
];
