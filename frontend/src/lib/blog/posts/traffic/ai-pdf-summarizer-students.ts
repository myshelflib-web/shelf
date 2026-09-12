import { longPost } from "../../longPost";

export const aiPdfSummarizerStudents = longPost(
  {
    slug: "ai-pdf-summarizer-students",
    title: "AI PDF Summarizer for Students — Notes & Mind Maps from Textbooks",
    description:
      "Use Shelf as an AI PDF summarizer for students: turn long textbook chapters into revision summaries, bullet notes, and mind maps grounded in your uploads.",
    excerpt:
      "Students need summaries that match their coaching PDF — not generic web condensations. Shelf Study AI summarizes from your file.",
    publishedAt: "2026-09-11",
    tags: ["AI PDF summarizer", "mind map", "revision", "Study AI"],
  },
  [
    {
      heading: "Why student summarizers fail",
      paragraphs: [
        "Open-web summarizers mix editions and invent headings. For exams you need terminology from the PDF you were assigned.",
      ],
    },
    {
      heading: "Summarize a page or selection",
      paragraphs: [
        "In Shelf’s reader, run summarize / notes / mind map on the open page or a highlight. Outputs stay tied to that source.",
      ],
    },
    {
      heading: "Mind maps for visual revision",
      paragraphs: [
        "Convert dense sections into scannable mind maps before mocks — then reopen the PDF when a node is unclear.",
      ],
    },
    {
      heading: "Pair with quizzes",
      paragraphs: [
        "After summarizing, generate a quiz from the same scope so you practice active recall, not only reread the summary.",
      ],
    },
    {
      heading: "Privacy",
      paragraphs: [
        "Your uploads stay in your private library. Summaries are for your revision workflow, not a public content dump.",
      ],
    },
    {
      heading: "Start",
      paragraphs: [
        "Upload a chapter PDF and try Summarize. Feature page: /features/study-ai-summaries.",
      ],
    },
  ]
);
