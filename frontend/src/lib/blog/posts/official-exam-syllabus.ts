import { buildPost } from "../types";

export const officialExamSyllabus = buildPost(
  {
    slug: "official-exam-syllabus-pdfs",
    title: "Official Exam Syllabus PDFs in the Shelf Reader",
    description:
      "Open official exam syllabus PDFs in the Shelf reader. Browse UPSC, GATE, CA, Judiciary, NEET PG, and State PCS files from the Explore Syllabus section.",
    excerpt:
      "Explore now has a Syllabus section for official exam PDFs already stored on Shelf. Each file opens in the same reader you use for other public study pages.",
    publishedAt: "2026-09-05",
    tags: ["learn", "syllabus", "pdf", "exams"],
    readingMinutes: 4,
  },
  [
    {
      heading: "A Syllabus section next to your exam track",
      paragraphs: [
        "Official syllabus files for the exams on Shelf now appear as their own Browse section — Syllabus — in Explore and in the Library Preloaded tab. The rest of Browse is unchanged: current affairs, generated collections, and Study skills stay where they were.",
        "Open Syllabus to see one folder per exam that has an official PDF. Click a file and it loads in the same reader as other public pages, including tabs and split view if you already use those.",
      ],
    },
    {
      heading: "The same reader, not a new flow",
      paragraphs: [
        "Syllabus PDFs use the existing public reader path. You can highlight, ask Study AI, and save a copy to your Library the same way you do for other Learn articles that have a PDF.",
        "Closing the last open PDF still returns you to Explore. Guest browse and signed-in Library browse both show the section when files are available.",
      ],
    },
    {
      heading: "Which exams appear",
      paragraphs: [
        "The section lists exams that already have an official syllabus PDF in Shelf storage — typically UPSC CSE, State PCS, Judiciary, CA, NEET PG, and GATE when those files are present. If an exam has no file yet, it simply does not show up.",
        "Your study-track filter still scopes generated notes. Syllabus stays visible on every track so you can open another exam's official PDF without leaving Explore.",
      ],
    },
  ]
);
