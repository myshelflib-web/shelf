import { longPost } from "../../longPost";

export const collegeStudents = longPost(
  {
    slug: "college-students-lecture-notes",
    title: "College Students: Turn Lecture PDFs into a Living Study Library",
    description: "How university and college students use Shelf to organize lecture slides, textbooks, and notes — with highlights, Study AI summaries, and a weekly planner.",
    excerpt: "One collection per course, topics per week or unit, highlights during class review, and Study AI for exam-week synthesis — a Shelf workflow built for campus life.",
    publishedAt: "2026-03-03",
    tags: ["college","university","lecture notes","students"],
  },
  [
    {
      heading: "One collection per course",
      paragraphs: [
        "Name collections after course codes or titles: CS201 Algorithms, History 110. Inside, create topics for midterms, finals, or weekly modules.",
        "Root-level pages work for campus-wide resources: academic calendar PDF, style guide, or lab safety sheet.",
      ],
    },
    {
      heading: "After each lecture",
      paragraphs: [
        "Upload the slide deck the same day. Highlight what the instructor emphasized orally — those marks become your exam filter later.",
        "Add a two-line doc page for open questions. Ask Study AI overnight on confusing slides while context is fresh.",
      ],
    },
    {
      heading: "Textbook chapters beside slides",
      paragraphs: [
        "Keep textbook PDFs in the same topic as the matching lecture. Split view: slides left, textbook right — compare definitions without alt-tabbing.",
        "When Study AI answers, ask it to reconcile slide wording with textbook wording using both sources in library-wide chat.",
      ],
    },
    {
      heading: "Group projects without shared chaos",
      paragraphs: [
        "Your Shelf library stays private. Export summaries or paste AI short notes into shared Google Docs for the team; keep the annotated sources personal.",
        "Pin the project collection during crunch weeks so it never sinks under other courses.",
      ],
    },
    {
      heading: "Exam week synthesis",
      paragraphs: [
        "Use library-wide Study AI scoped to one course collection: List weak topics from my highlights this month. Generate a mind map of Unit 3 only from highlighted text.",
        "Schedule revision blocks on the planner linked to exact pages — open from calendar when the block starts.",
      ],
    },
    {
      heading: "Laptop and phone rhythm",
      paragraphs: [
        "Annotate on laptop in the library; review highlights on phone during commute with the PWA. Reading progress syncs when you are signed in.",
        "Offline cache helps on campus Wi-Fi that drops mid-PDF.",
      ],
    },
    {
      heading: "Avoid the Downloads trap",
      paragraphs: [
        "If a PDF lives only in Downloads, it is not in your study system. Upload once to Shelf and delete the local clutter when processing finishes.",
      ],
    },
    {
      heading: "Semester reset",
      paragraphs: [
        "Archive finished courses by unpinning and sorting older collections down. Keep one Continue reading pin for the current term only.",
        "Your streak and planner carry forward — habits survive even when course folders change.",
      ],
    }
  ]
);
