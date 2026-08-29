import type { FeatureCategory } from "./featureTypes";

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: "library",
    label: "Library & reader",
    description:
      "Organize PDFs, highlight as you read, and work in a multi-tab reader workspace.",
  },
  {
    id: "study-ai",
    label: "Study AI",
    description:
      "Ask questions grounded in your uploads — from a highlight, a page, or your whole library.",
  },
  {
    id: "practice",
    label: "Practice & planning",
    description:
      "Exam-style quizzes, a revision calendar, and a dashboard that tracks reading habits.",
  },
  {
    id: "integrations",
    label: "Integrations",
    description:
      "Import PDFs from Telegram and send them back, play Spotify beside your reader, and share documents with classmates.",
  },
  {
    id: "platform",
    label: "Platform",
    description:
      "Offline PWA, cross-device sync, keyboard shortcuts, free curriculum, and Premium plans.",
  },
];
