import { buildPost } from "../types";

export const freeCurriculum = buildPost(
  {
    slug: "free-exam-curriculum-learn",
    title: "Free Curriculum Library on Shelf Learn (Optional Study Packs)",
    description:
      "Browse optional free curriculum packs on /learn — syllabus articles and topic guides. Separate from your private uploads on /my-content. No sign-in required to read.",
    excerpt:
      "Shelf Learn is the public curriculum catalog. Use it for baseline reading; sign in to build a private library with your own PDFs, highlights, and Study AI.",
    publishedAt: "2026-02-14",
    tags: ["learn", "curriculum", "free", "syllabus"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Two libraries, one product",
      paragraphs: [
        "Shelf separates admin-published curriculum (/learn/...) from your personal collections (/my-content). The Learn section is SEO-indexed, browsable without an account, and organized as Subject → Topic → Article.",
        "You do not need Learn to use Shelf. Many people only use private uploads — Learn is optional baseline material when it helps.",
      ],
    },
    {
      heading: "Reading curriculum articles",
      paragraphs: [
        "Articles render with familiar reader chrome: highlights on HTML where available, progress when signed in, and PDF attachments via presigned URLs with Range fetching.",
      ],
    },
    {
      heading: "When to use Learn vs My Content",
      paragraphs: [
        "Use Learn for shared syllabus-style coverage. Use My Content for coaching notes, marked-up PDFs, research papers, work docs, and anything Study AI should query privately.",
        "Keep Learn open in one tab and your uploads in another when you want both.",
      ],
    },
    {
      heading: "Study goals for any track",
      paragraphs: [
        "Pick a study goal in Settings so Study AI tone matches your context — competitive exams, professional certs, or general study — without changing how you organize files.",
      ],
    },
  ]
);
