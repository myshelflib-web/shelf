import { longPost } from "../../longPost";

export const studentStudyToolAskLlm = longPost(
  {
    slug: "student-study-tool-ask-llm",
    title: "Student Study Tool: Organize Notes, Ask an LLM, Quiz & Plan",
    description:
      "Shelf is a student study tool: store lecture PDFs and notes, ask Study AI (an LLM) questions about your material, sit quizzes from your files, and plan revision — one workspace.",
    excerpt:
      "Students ask an LLM about their own notes and PDFs on Shelf Study AI, with citations back to class material — plus library, quiz, and planner.",
    publishedAt: "2026-09-11",
    tags: ["students", "Study AI", "LLM", "study tool", "notes"],
  },
  [
    {
      heading: "The student study tool checklist",
      paragraphs: [
        "A useful student study tool should: hold your PDFs and notes, let you highlight while reading, answer questions from that material, test you, and remind you what to revise.",
        "Shelf is designed around that checklist instead of being only a chatbot or only a notebook.",
      ],
    },
    {
      heading: "Store class material once",
      paragraphs: [
        "Upload lecture slides, coaching PDFs, and typed notes into collections per course. YouTube lectures and sketch notebooks sit beside them — no forced General folder.",
      ],
    },
    {
      heading: "Ask an LLM about your notes",
      paragraphs: [
        "When students search “ask question to LLM” about homework, the failure mode is a generic model that never saw the syllabus. Study AI retrieves from your uploads and cites pages.",
        "Ask from a highlight (⌘L), the open PDF, or library-wide chat when the answer spans several files.",
      ],
    },
    {
      heading: "Quiz yourself from the same files",
      paragraphs: [
        "Generate MCQs and written practice from your notes so revision matches what you actually studied. Review the analysis board after each sitting.",
      ],
    },
    {
      heading: "Plan the week",
      paragraphs: [
        "Link planner tasks to pages so “revise federalism” opens the right PDF. Optional study goals frame Study AI for your exam track.",
      ],
    },
    {
      heading: "Start in ten minutes",
      paragraphs: [
        "Create an account, upload one PDF and one notes page, ask Study AI a question you already know, and check the citation. Then open /features/study-ai or /features/all-in-one-study-workspace for the full map.",
      ],
    },
  ]
);
