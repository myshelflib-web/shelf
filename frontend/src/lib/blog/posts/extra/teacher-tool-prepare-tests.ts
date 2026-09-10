import { longPost } from "../../longPost";

export const teacherToolPrepareTests = longPost(
  {
    slug: "teacher-tool-prepare-tests",
    title: "Teacher Tool for Preparing Tests from Lesson PDFs and Notes",
    description:
      "Use Shelf as a teacher tool for preparing tests: organize lesson PDFs, generate MCQs and written quizzes from your notes, keep keys private, and share handouts with students.",
    excerpt:
      "Teachers and tutors prepare class tests from the same materials they teach — Shelf Quiz grounded in your lesson PDFs, not a random question bank.",
    publishedAt: "2026-09-11",
    tags: ["teachers", "tests", "quiz", "MCQ", "education"],
  },
  [
    {
      heading: "What teachers search for",
      paragraphs: [
        "“Teacher tool for preparing tests” usually means: take this week’s worksheet or chapter PDF, produce fair practice questions, and avoid leaking answer keys to the whole class chat.",
        "Shelf is built so prep materials and quiz generation live in one private library.",
      ],
    },
    {
      heading: "Organize the syllabus first",
      paragraphs: [
        "Create a collection per class or subject. Keep public handouts and private answer keys in different topics. Annotate the PDF while you decide what to examine.",
      ],
    },
    {
      heading: "Generate exam-style items from your notes",
      paragraphs: [
        "Open Shelf Quiz, scope the lesson PDF or upload, and generate MCQs and written prompts grounded in that material. Adjust difficulty and use practice sittings for drills.",
        "Study AI can help rephrase a stem or suggest an easier variant — still tied to your worksheet text.",
      ],
    },
    {
      heading: "Share handouts, not keys",
      paragraphs: [
        "Share Shelf pages when students should open the same PDF. Keep answer keys and marking schemes in a private topic. Optional Telegram send for delivery outside the LMS.",
      ],
    },
    {
      heading: "Tutors with many students",
      paragraphs: [
        "Keep a master materials collection and reuse quiz scopes across batches. Planner events track sessions; tasks track “print / upload paper” linked to the source page.",
      ],
    },
    {
      heading: "Students on the same quiz workspace",
      paragraphs: [
        "The same product works as a student study tool: learners sit practice papers from their own notes. One app for both sides of the classroom.",
        "Product page: /features/teacher-test-prep. Lesson-notes workflow: /blog/teachers-lesson-materials.",
      ],
    },
  ]
);
