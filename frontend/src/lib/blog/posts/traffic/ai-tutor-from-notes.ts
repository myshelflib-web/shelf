import { longPost } from "../../longPost";

export const aiTutorFromNotes = longPost(
  {
    slug: "ai-tutor-from-notes",
    title: "AI Tutor from Your Notes — Personal Study Help Grounded in PDFs",
    description:
      "Use Shelf Study AI as a personal AI tutor from your notes and PDFs. Get explanations, homework help, and citations from your uploads — free plan available.",
    excerpt:
      "An AI tutor only helps exams when it has read your syllabus PDF. Shelf Study AI tutors from your library with citations.",
    publishedAt: "2026-09-11",
    tags: ["AI tutor", "Study AI", "students", "homework", "PDF"],
  },
  [
    {
      heading: "Generic tutors vs grounded tutors",
      paragraphs: [
        "ChatGPT-style tutors invent methods. Grounded tutors retrieve from your textbook and class notes before explaining.",
      ],
    },
    {
      heading: "How Shelf tutors",
      paragraphs: [
        "Upload materials, ask Study AI to explain a highlight or chapter, attach syllabus docs for exam framing, and verify citations.",
      ],
    },
    {
      heading: "Homework help without cheating yourself",
      paragraphs: [
        "Ask for hints and worked steps tied to your notes — then close the chat and redo the problem. Pair with a practice quiz from the same scope.",
      ],
    },
    {
      heading: "For teachers and tutors",
      paragraphs: [
        "Prep differentiation ideas from worksheets, then generate class tests from the same PDFs.",
      ],
    },
    {
      heading: "Depth modes",
      paragraphs: [
        "Quick for definitions; Standard/Deep (Premium) for longer tutoring turns.",
      ],
    },
    {
      heading: "Open the tutor",
      paragraphs: [
        "Go to /features/ai-tutor or /study-ai after sign-in.",
      ],
    },
  ]
);
