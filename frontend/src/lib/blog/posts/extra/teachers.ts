import { longPost } from "../../longPost";

export const teachers = longPost(
  {
    slug: "teachers-lesson-materials",
    title: "Teachers and Tutors: Organize Lesson PDFs, Handouts, and Prep Notes",
    description: "How educators use Shelf to keep lesson plans, worksheets, and reference PDFs organized — with annotations, Study AI for differentiation ideas, and a teaching calendar.",
    excerpt: "Collections per class or subject, topics per unit, annotated handouts, and planner events for class sessions — Shelf as a quiet prep library for teachers and tutors.",
    publishedAt: "2026-03-08",
    tags: ["teachers","tutors","education","lesson plans"],
  },
  [
    {
      heading: "Collections mirror your timetable",
      paragraphs: [
        "One collection per class section or subject you teach. Topics for units or weeks. Root pages for school policies and rubrics.",
        "Upload publisher PDFs and your own worksheets as separate pages.",
      ],
    },
    {
      heading: "Prep annotations",
      paragraphs: [
        "Highlight examples you will work on the board. Mark extension questions for advanced students.",
        "Ask Study AI for three easier rephrasings of this problem using the worksheet text — then edit for your classroom voice.",
      ],
    },
    {
      heading: "Tutor libraries",
      paragraphs: [
        "Tutors juggling many students can keep a Master materials collection and per-student note docs — still private to your account.",
      ],
    },
    {
      heading: "Calendar for sessions",
      paragraphs: [
        "Planner events for classes; tasks for photocopy or LMS upload reminders linked to the handout page.",
      ],
    },
    {
      heading: "Reuse next year",
      paragraphs: [
        "Rename titles, keep slugs stable, and pin the active term. Last year’s highlights remain as institutional memory.",
      ],
    },
    {
      heading: "Curriculum vs personal",
      paragraphs: [
        "Point students to public /learn packs when relevant; keep your proprietary worksheets only in your private library.",
      ],
    },
    {
      heading: "Tablet markup",
      paragraphs: [
        "Sketch notebooks help when you draft diagrams before class. Pair with PDF handouts in split view.",
      ],
    },
    {
      heading: "Boundaries",
      paragraphs: [
        "Shelf stores your prep — student PII should stay in your school systems. Use Shelf for materials, not gradebooks.",
      ],
    }
  ]
);
