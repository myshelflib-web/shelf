import { buildPost } from "../types";

export const studyAiPinChats = buildPost(
  {
    slug: "pin-study-ai-chats",
    title: "Pin Study AI Chats You Keep Coming Back To",
    description:
      "Pin important Study AI threads to the top of your chat list. Keep syllabus drills, revision maps, and long tutoring threads one click away across devices.",
    excerpt:
      "Pin up to ten Study AI conversations so they stay above Today and Yesterday — synced to your account, not stuck on one browser.",
    publishedAt: "2026-09-11",
    tags: ["study ai", "chat", "organization", "productivity"],
    readingMinutes: 4,
  },
  [
    {
      heading: "Keep the important threads visible",
      paragraphs: [
        "Study AI chats build up quickly once you use them for syllabus checks, mind maps, and follow-up drills. Pinning lifts a conversation into a Pinned section at the top of the sidebar so you do not dig through date buckets every time you return.",
      ],
      bullets: [
        "Open the ··· menu on any chat → Pin",
        "Pinned threads show a small pin icon and stay above Today / Yesterday",
        "Unpin from the same menu when the thread is done",
        "Up to ten pins per account — enough for active subjects without clutter",
      ],
    },
    {
      heading: "Synced with your account",
      paragraphs: [
        "Pins live on the server with the rest of your Study AI history. Sign in on another device and the same threads stay pinned — the same pattern as starring a library page, not a browser-only bookmark.",
      ],
    },
    {
      heading: "Works with rename and search",
      paragraphs: [
        "Rename a pinned chat anytime; the pin stays. Search still finds pinned and unpinned threads by title. Reader Ask AI chats that appear in Study AI can be pinned too once they show up in the list.",
      ],
    },
  ]
);
