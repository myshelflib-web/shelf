import { buildPost } from "../types";

export const studyAiChatControls = buildPost(
  {
    slug: "study-ai-stop-queue-diagrams",
    title: "Stop, Queue, Edit, and Preview Diagrams in Study AI",
    description:
      "Study AI lets you stop a reply, queue the next question, edit a sent message like Cursor, run slash commands, and preview Mermaid diagrams.",
    excerpt:
      "Chat like a modern tutor: stop generation, queue follow-ups, edit a prior question to branch the thread, delete a bad turn, and open mermaid diagrams full-screen.",
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
        "Hover a message to edit or delete it. Edit works like Cursor: change your question, drop that turn and everything after it, and resubmit. Deleting your question also removes the following answer so the thread stays a clean Q&A.",
        "When Study AI returns flashcards (/flashcards), use Study cards to flip through them in a modal, download the deck, or save it to your library.",
      ],
      bullets: [
        "Stop — halt generation without losing the rest of the chat",
        "Queue — send follow-ups while a reply is still streaming",
        "Edit — rewrite a prior question and regenerate from that point",
        "Flashcards — study, download, or save a deck from the reply",
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
        "Type / in the composer — or tap the / button — for a command palette: quiz opens the dedicated Quiz workspace (MCQ, written, and photo answers), plus mind map, PYQ drill, flashcards, notes, plan, and more. Suggestion chips above the box rotate the way greetings do, so the chat stays easy to start. Retrieval now fuses vector search with keywords, spreads excerpts across pages, and rewrites short follow-ups like “explain this” using the previous question so the next search is not lost.",
      ],
    },
  ]
);
