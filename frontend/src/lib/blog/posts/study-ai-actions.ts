import { buildPost } from "../types";

export const studyAiActions = buildPost(
  {
    slug: "study-ai-planner-quiz-actions",
    title: "Ask Study AI to Add Tasks, Reminders, and Quizzes",
    description:
      "Shelf Study AI answers general questions beyond your open PDF and can create planner tasks, reminders, and quizzes when you ask in chat.",
    excerpt:
      "Study AI is no longer limited to the open file. Ask anything, or say “remind me tomorrow” or “make a quiz on this chapter” and it acts in the app.",
    publishedAt: "2026-08-27",
    tags: ["study ai", "planner", "quiz", "tools"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Beyond the open PDF",
      paragraphs: [
        "In the reader panel and on /study-ai, you can ask questions that are not in the document you are reading — definitions, study strategy, worked math, or how Shelf works. When the answer is in your library, Study AI still grounds and cites those pages first.",
        "Document modes like Summarize, Notes, and Mind map stay focused on the open file. Free-form Ask can go wider.",
      ],
    },
    {
      heading: "Planner tasks and reminders",
      paragraphs: [
        "Say things like “add a task to revise Tort tomorrow at 6pm” or “remind me to finish this chapter Friday.” Study AI creates planner items you can open on /planner, including unscheduled To-plan tasks when you do not specify a date.",
        "You can also ask it to mark something done or reschedule after it looks up your upcoming items.",
      ],
    },
    {
      heading: "Start a quiz from chat",
      paragraphs: [
        "Ask “make a medium quiz on this page” or “exam-style MCQs on federalism.” Study AI starts generation and gives you a /quiz/:id link while questions build in the background — same engine as the Quiz workspace.",
        "From the reader, quizzes default to the open document; from library-wide chat you can scope to a collection, topic, page, or the whole library.",
      ],
    },
  ]
);
