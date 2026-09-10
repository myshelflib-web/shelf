import type { ShelfFeature } from "../featureTypes";

export const PRACTICE_FEATURES: ShelfFeature[] = [
  {
    slug: "ai-flashcards-quizzes",
    category: "practice",
    title: "AI Flashcards & Quizzes from PDF Notes | Shelf",
    metaDescription:
      "Generate AI flashcards and exam-style quizzes from PDF notes on Shelf. Quizlet- and Anki-style practice grounded in your uploads — MCQ, written, and photo working.",
    keywords: [
      "AI flashcards from PDF",
      "generate quiz from PDF",
      "PDF to flashcards AI",
      "Quizlet alternative AI",
      "Anki AI from notes",
      "AI quiz generator from notes",
    ],
    headline: "Flashcards and quizzes from the same PDFs you read",
    subhead:
      "Turn textbook chapters and class notes into active practice: Study AI flashcards plus Shelf Quiz papers — without copying text into another app.",
    bullets: [
      "Flashcards from Study AI on a page or thread",
      "Exam-style MCQ and written quizzes from library scope",
      "Practice or proctored sittings with analysis",
      "Teachers can prepare tests from the same material",
    ],
    paragraphs: [
      "Passive rereading fails. Shelf connects chat-with-PDF to flashcards and quizzes so retrieval practice stays tied to what you actually uploaded.",
    ],
    relatedBlogSlug: "ai-flashcards-quizzes-from-pdf",
    ctaHref: "/quiz",
    ctaLabel: "Make a quiz",
    secondaryCtaHref: "/login?next=/study-ai",
    secondaryCtaLabel: "Open Study AI flashcards",
  },
  {
    slug: "teacher-test-prep",
    category: "practice",
    title: "Teacher Tool for Preparing Tests from Notes & PDFs | Shelf",
    metaDescription:
      "Teacher tool for preparing tests: organize lesson PDFs, generate exam-style MCQs and written items from your notes, keep answer keys private, and share handouts with students.",
    keywords: [
      "teacher tool for preparing tests",
      "teacher quiz maker from notes",
      "prepare MCQ tests for class",
      "create quiz from lesson PDF",
      "tutor exam paper generator",
      "teacher assessment tool",
    ],
    headline: "Prepare tests from the same PDFs you teach",
    subhead:
      "Upload syllabus and worksheets, then build exam-style quizzes from that material. Shelf keeps prep in your private library — share only the handouts students should see.",
    bullets: [
      "Generate MCQ and written items from lesson PDFs or uploads",
      "Practice or proctored sittings for class drills",
      "Share Shelf handouts; keep answer keys in a private topic",
      "Study AI helps rephrase stems or differentiate difficulty",
    ],
    paragraphs: [
      "Teachers and tutors often juggle a drive folder, a quiz website, and ChatGPT. Shelf is a teacher tool that keeps materials and test prep together so papers stay grounded in what you actually taught.",
      "Students can sit the same quiz workspace for self-study — one product for both sides of the classroom.",
    ],
    relatedBlogSlug: "teacher-tool-prepare-tests",
    ctaHref: "/quiz",
    ctaLabel: "Prepare a test",
    secondaryCtaHref: "/blog/teachers-lesson-materials",
    secondaryCtaLabel: "Lesson materials guide",
  },
  {
    slug: "exam-quiz",
    category: "practice",
    title: "Exam-Style Quiz from Your Notes — Students & Teachers | Shelf",
    metaDescription:
      "Student quizzes and teacher test prep from your Shelf notes: timed MCQs, written answers, and photo working. Proctored or practice, then a per-quiz analysis board.",
    keywords: [
      "exam quiz app",
      "student study quiz",
      "teacher tool for preparing tests",
      "MCQ from PDF",
      "PYQ practice quiz",
      "written answer quiz",
    ],
    headline: "Exam-style papers from your notes",
    subhead:
      "Proctored or practice sittings: MCQs with four options, LaTeX written answers, and photos of handwritten working — from your indexed material.",
    bullets: [
      "Library, upload, or exam-bank paper sources",
      "Optional fullscreen proctoring (tab switch ends the paper)",
      "Instant MCQ marking; AI grading for written items",
      "Per-quiz analysis: score, accuracy, topics, review",
    ],
    paragraphs: [
      "Shelf Quiz is not a generic question bank. Stems come from excerpts retrieved from your uploads — or preloaded curriculum when you choose exam-bank mode.",
    ],
    relatedBlogSlug: "exam-style-quiz-from-your-notes",
    ctaHref: "/quiz",
    ctaLabel: "Start a quiz",
    canonicalPath: "/quiz",
  },
{
    slug: "planner-calendar",
    category: "practice",
    title: "Study Planner & Revision Calendar | Shelf",
    metaDescription:
      "Plan revision on Shelf with tasks and events on a daily, weekly, and monthly calendar. Link items to library pages and open them in one click.",
    keywords: [
      "study planner app",
      "revision calendar",
      "study schedule app",
      "exam revision planner",
    ],
    headline: "Plan the week beside your library",
    subhead:
      "Tasks and events on one calendar — daily, weekly, and monthly views with links back to the pages you need to read.",
    bullets: [
      "Tasks vs calendar events",
      "Link planner items to specific pages",
      "Weekly and monthly overview",
      "Study AI can add tasks from chat",
    ],
    paragraphs: [
      "When a task says 'Revise Polity Laxmikanth Ch. 4', clicking it should open that PDF — not a dead checklist line. Shelf planner links do exactly that.",
    ],
    relatedBlogSlug: "planner-tasks-events-calendar",
    ctaHref: "/login?next=/planner",
    ctaLabel: "Open planner",
  },
{
    slug: "dashboard-streak",
    category: "practice",
    title: "Study Dashboard, Streaks & Reading Stats | Shelf",
    metaDescription:
      "Track reading time, study streaks, and library usage on the Shelf dashboard. See what you opened recently and stay accountable during exam prep.",
    keywords: [
      "study streak app",
      "reading tracker students",
      "study habit dashboard",
      "study analytics app",
    ],
    headline: "See your study rhythm",
    subhead:
      "Dashboard summaries show usage, streaks, and recent activity — a calm overview after sign-in, not a gamified distraction.",
    bullets: [
      "Reading and Study AI usage summaries",
      "Streak tracking for consistent habits",
      "Quick links to pinned and recent pages",
      "Pairs with planner for weekly goals",
    ],
    paragraphs: [
      "Long exam cycles need accountability without noise. The dashboard gives enough signal to notice when revision slipped — without social feeds or leaderboards.",
    ],
    relatedBlogSlug: "study-dashboard-streak-achievements",
    ctaHref: "/login?next=/dashboard",
    ctaLabel: "View dashboard",
  },
{
    slug: "study-streak-share-cards",
    category: "practice",
    title: "Share Study Streak Cards for Instagram & WhatsApp | Shelf",
    metaDescription:
      "Export Strava-style study streak cards from Shelf — reading time, medals, and active days — sized for Instagram Stories, WhatsApp, and Telegram.",
    keywords: [
      "study streak share",
      "study progress instagram",
      "exam prep accountability",
      "reading streak card",
    ],
    headline: "Share your study streak",
    subhead:
      "Story-ready PNG cards from your reading stats — private library, public consistency.",
    bullets: [
      "Flame popover or dashboard share button",
      "Story (9:16) and square formats",
      "Toggle study goal and today's minutes",
      "Native share, PNG download, or Telegram link",
    ],
    paragraphs: [
      "Accountability without a social feed. Export a dark, on-brand card when your streak is worth celebrating — then post it wherever your batch hangs out.",
    ],
    relatedBlogSlug: "share-study-streak-cards",
    ctaHref: "/login?next=/dashboard",
    ctaLabel: "Share a streak",
  },
];
