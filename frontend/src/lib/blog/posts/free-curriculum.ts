import { buildPost } from "../types";

export const freeCurriculum = buildPost(
  {
    slug: "free-exam-curriculum-learn",
    title: "Free Exam Curriculum Library on Shelf Learn",
    description:
      "Browse free UPSC syllabus articles, NCERT-aligned topics, and admin-published curriculum on /learn — no sign-in required. Separate from your private uploads.",
    excerpt:
      "Shelf Learn is the public curriculum catalog. Read articles for free; sign in to build your own parallel library with uploads and Study AI on your material.",
    publishedAt: "2026-02-14",
    tags: ["learn", "curriculum", "upsc", "free"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Two libraries, one product",
      paragraphs: [
        "Shelf separates admin-published curriculum (/learn/...) from your personal collections (/my-content). The Learn section is SEO-indexed, browsable without an account, and organized as Subject → Topic → Article — familiar to anyone using structured exam syllabi.",
      ],
    },
    {
      heading: "Reading curriculum articles",
      paragraphs: [
        "Articles render with the same reader chrome as personal content where applicable: highlights on HTML, progress tracking when signed in, and PDF attachments served via presigned URLs with Range fetching.",
      ],
    },
    {
      heading: "When to use Learn vs My Content",
      paragraphs: [
        "Use Learn for baseline syllabus coverage everyone can access. Use My Content for coaching notes, marked-up PDFs, answer scripts, and anything you need Study AI to query privately. Many students keep Learn open in one tab and their uploads in another.",
      ],
    },
    {
      heading: "Study goals",
      paragraphs: [
        "Pick a study goal in Settings so both curriculum reading and personal Study AI sessions stay aligned with UPSC, State PCS, Judiciary, CA, NEET PG, or GATE tracks.",
      ],
    },
  ]
);
