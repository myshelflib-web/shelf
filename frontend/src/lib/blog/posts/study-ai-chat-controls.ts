import { buildPost } from "../types";

export const studyAiChatControls = buildPost(
  {
    slug: "study-ai-stop-queue-diagrams",
    title: "Stop, Queue, Delete, and Preview Diagrams in Study AI",
    description:
      "Study AI now lets you stop a reply, queue the next question, delete turns, preview Mermaid diagrams, and look up your library, planner, Google, or the web.",
    excerpt:
      "Chat like a modern tutor: stop generation, queue follow-ups, delete a bad turn, open mermaid diagrams full-screen, and let Study AI search your library, highlights, planner, or Google.",
    publishedAt: "2026-08-26",
    updatedAt: "2026-08-26",
    tags: ["study ai", "chat", "mermaid", "rag"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Control the conversation",
      paragraphs: [
        "While Study AI is writing, the stop control cancels the model stream and keeps any partial answer that already landed. Type the next question at the same time — it queues and sends automatically when the current reply finishes or you stop it.",
        "Hover a message to delete it. Deleting your question also removes the following answer so the thread stays a clean Q&A.",
      ],
      bullets: [
        "Stop — halt generation without losing the rest of the chat",
        "Queue — send follow-ups while a reply is still streaming",
        "Delete — drop a turn inside the thread, not the whole chat",
      ],
    },
    {
      heading: "Preview Mermaid diagrams",
      paragraphs: [
        "Mind maps and flowcharts render inline. Use Preview on a diagram to open a larger overlay — useful when a mermaid mind map is dense or you want to screenshot a revision map.",
      ],
    },
    {
      heading: "Tools and better retrieval",
      paragraphs: [
        "Library-wide Study AI can search your collections, open a page, list recents and starred files, read highlights and syllabus docs, check the planner, search Google, and fetch a public page when your notes do not cover the question. Answers still prefer your files and cite them as [1], [2].",
        "Retrieval now fuses vector search with keywords, spreads excerpts across pages, and rewrites short follow-ups like “explain this” using the previous question so the next search is not lost.",
      ],
    },
  ]
);
