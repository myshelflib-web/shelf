import { longPost } from "../../longPost";

export const vsNotionAi = longPost(
  {
    slug: "shelf-vs-notion-ai",
    title: "Shelf vs Notion AI: PDF Study Library vs Workspace Assistant",
    description:
      "Notion AI helps inside Notion pages. Shelf is a personal study library for PDFs and notes with Study AI — an LLM grounded in your uploads — plus reader, quiz, and planner.",
    excerpt:
      "Notion AI is excellent for drafting and summarizing Notion content. Shelf focuses on PDF-heavy study: store files, highlight, then ask an LLM grounded in your library.",
    publishedAt: "2026-09-11",
    tags: ["comparison", "Notion AI", "Study AI", "PDF", "LLM"],
  },
  [
    {
      heading: "Different centers of gravity",
      paragraphs: [
        "Notion is a general workspace: wikis, tasks, databases, and AI that drafts inside pages you already wrote.",
        "Shelf is a study library centered on PDFs and notes you upload, with a reader and Study AI that retrieves from those files.",
      ],
    },
    {
      heading: "PDFs as first-class study objects",
      paragraphs: [
        "Shelf’s reader range-fetches large PDFs, keeps highlights on the page, supports tabs and split view, and opens Study AI on a selection without leaving the document.",
        "Notion can embed or link PDFs, but deep annotation-and-ask workflows are not its primary design.",
      ],
    },
    {
      heading: "LLM grounded in your library",
      paragraphs: [
        "Study AI answers from indexed Shelf pages with citations. Scope filters keep a constitutional-law folder from leaking into a chemistry collection.",
        "Notion AI shines when your source of truth is already Notion text; Shelf shines when the source of truth is a folder of PDFs and typed notes.",
      ],
    },
    {
      heading: "Quizzes and exam-style practice",
      paragraphs: [
        "Shelf can generate MCQ and written quizzes from library material or uploads, with practice or proctored sittings. That is a different job from Notion AI’s writing aids.",
      ],
    },
    {
      heading: "When Notion AI is the better tool",
      paragraphs: [
        "Stay in Notion when your team wiki, meeting notes, and project docs already live there and PDFs are occasional attachments — not the main study corpus.",
      ],
    },
    {
      heading: "When Shelf is the better tool",
      paragraphs: [
        "Choose Shelf when the job is “store my notes and PDFs and ask an LLM about them,” especially for competitive exams, coursework, or research reading piles.",
        "You can still use Notion for life admin and Shelf for the PDF library — they are complementary more often than mutually exclusive.",
      ],
    },
  ]
);
