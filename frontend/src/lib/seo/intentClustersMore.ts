import type { IntentCluster } from "./intentClustersCore";

export const INTENT_CLUSTERS_MORE: IntentCluster[] = [
  {
    id: "offline",
    label: "Offline PDF study app (PWA)",
    answer:
      "Install Shelf as a PWA for offline-friendly study — cached library metadata and reading workflows when connectivity is spotty.",
    queries: [
      "offline PDF reader app",
      "PWA study app",
      "offline revision app",
      "install study app home screen",
    ],
    path: "/features/pwa-offline",
  },
  {
    id: "sync",
    label: "Cross-device reading progress",
    answer:
      "Open Shelf on laptop or phone and pick up where you left off — reading progress, library structure, and Study AI threads sync when signed in.",
    queries: [
      "sync PDF reading progress",
      "cross device study app",
      "read PDF on phone and laptop",
    ],
    path: "/features/cross-device-sync",
  },
  {
    id: "privacy",
    label: "Private study library",
    answer:
      "Your /my-content uploads stay private to your account. Public Learn curriculum is separate and optional; sharing is explicit only.",
    queries: [
      "private PDF library",
      "secure study notes app",
      "private study workspace",
    ],
    path: "/blog/privacy-private-study-library",
  },
  {
    id: "gate-syllabus",
    label: "Free GATE syllabus and previous papers",
    answer:
      "Browse free GATE syllabus material, official previous-year papers, and open textbooks on Shelf Learn without signing in.",
    queries: [
      "GATE syllabus",
      "GATE previous year papers",
      "GATE study material free",
      "GATE PYQ PDF",
    ],
    path: "/learn/tracks/gate",
  },
  {
    id: "upsc-syllabus",
    label: "Free UPSC syllabus and CSE material",
    answer:
      "Free UPSC CSE papers, Budget, Economic Survey, Constitution, and related open-government PDFs on Shelf Learn.",
    queries: [
      "UPSC syllabus",
      "UPSC study material free",
      "UPSC previous year papers",
      "free UPSC notes",
    ],
    path: "/learn/tracks/upsc",
  },
  {
    id: "state-pcs",
    label: "Free State PCS papers (TNPSC, RPSC)",
    answer:
      "State PCS curriculum with TNPSC papers and RPSC samples from official sources — free to browse on Shelf Learn.",
    queries: [
      "State PCS syllabus",
      "TNPSC previous papers free",
      "RPSC question papers",
      "state PSC study material",
    ],
    path: "/learn/tracks/state-pcs",
  },
  {
    id: "judiciary",
    label: "Free judiciary bare acts and law PDFs",
    answer:
      "IPC, CrPC, CPC, Companies Act, and Law Commission reports for judiciary and law entrance prep on Shelf Learn.",
    queries: [
      "judiciary exam syllabus",
      "bare acts PDF free",
      "IPC CrPC CPC PDF",
      "judicial services preparation",
    ],
    path: "/learn/tracks/judiciary",
  },
  {
    id: "ca-syllabus",
    label: "Free CA study material",
    answer:
      "Open accounting textbooks and Companies Act references for CA Inter and Final on Shelf Learn.",
    queries: [
      "CA syllabus",
      "CA study material free",
      "CA Inter notes PDF",
      "Companies Act CA",
    ],
    path: "/learn/tracks/ca",
  },
  {
    id: "neet-pg",
    label: "Free NEET PG syllabus and NMC material",
    answer:
      "NMC curriculum references, exam notices, and open medical textbooks for NEET PG and INI-CET on Shelf Learn.",
    queries: [
      "NEET PG syllabus",
      "NEET PG study material free",
      "INI-CET preparation",
      "NMC curriculum PDF",
    ],
    path: "/learn/tracks/neet-pg",
  },
  {
    id: "learn-hub",
    label: "Free exam curriculum library",
    answer:
      "Shelf Learn is a public catalog of syllabus PDFs and topic guides for GATE, UPSC, State PCS, Judiciary, CA, and NEET PG — browse without an account.",
    queries: [
      "free study curriculum",
      "free exam study material",
      "open educational resources India",
      "online syllabus library",
    ],
    path: "/learn",
  },
  {
    id: "teachers",
    label: "Teacher resources for preparing lesson notes",
    answer:
      "Teachers and tutors organize lesson plan PDFs, worksheets, and prep annotations, share handouts with students, and use Study AI for differentiation ideas.",
    queries: [
      "teacher resources for preparing lesson notes",
      "teacher lesson plan PDFs",
      "preparing lesson notes app",
      "tutor handout organizer",
      "educator PDF library",
    ],
    path: "/blog/teachers-lesson-materials",
  },
  {
    id: "college",
    label: "College lecture notes organizer",
    answer:
      "College students use Shelf to keep lecture PDFs, slides, and YouTube playlists organized by course — with highlights, AI, and a planner.",
    queries: [
      "college lecture notes app",
      "university PDF organizer",
      "college study notes app",
    ],
    path: "/blog/college-students-lecture-notes",
  },
  {
    id: "law",
    label: "Law student case-law PDF library",
    answer:
      "Law students keep case briefs, bare acts, and annotated judgments in Shelf — split view, highlights, and Study AI for case analysis.",
    queries: [
      "law student case briefs",
      "legal PDF annotation",
      "law student PDF library",
    ],
    path: "/blog/law-students-case-law-library",
  },
  {
    id: "medical",
    label: "Medical and science PDF workflow",
    answer:
      "Medical and science students organize journals, textbooks, and course PDFs with annotations and Study AI grounded in their uploads.",
    queries: [
      "medical student notes app",
      "science journal PDF reader",
      "medical PDF annotation",
    ],
    path: "/blog/medical-and-science-pdf-workflow",
  },
  {
    id: "research",
    label: "Research paper highlighter and notes",
    answer:
      "Researchers highlight papers, keep literature notes beside PDFs, and ask Study AI across a private corpus of articles.",
    queries: [
      "research paper highlighter",
      "literature review PDF tool",
      "annotate research papers",
    ],
    path: "/blog/research-papers-literature-notes",
  },
  {
    id: "professionals",
    label: "Professional PDF workspace",
    answer:
      "Professionals annotate work documents, keep reference PDFs organized, and use Study AI on their own materials — not a student-only tool.",
    queries: [
      "professional PDF workspace",
      "annotate work documents",
      "work PDF library app",
    ],
    path: "/blog/professionals-work-documents",
  },
  {
    id: "language",
    label: "Language learning with PDF notes",
    answer:
      "Annotate textbooks and readers in another language, keep vocabulary notes beside PDFs, and revise with highlights and Study AI.",
    queries: [
      "language learning PDF notes",
      "annotate textbooks foreign language",
      "language study PDF app",
    ],
    path: "/blog/language-learning-with-pdfs",
  },
  {
    id: "nonfiction",
    label: "Nonfiction book notes and highlights",
    answer:
      "Keep nonfiction book PDFs, highlights, and typed notes in one library for lifelong learning — not only exam prep.",
    queries: [
      "book notes PDF app",
      "nonfiction reading highlights",
      "annotate ebooks for learning",
    ],
    path: "/blog/nonfiction-book-notes",
  },
  {
    id: "goal-aware",
    label: "Goal-aware Study AI for your study track",
    answer:
      "Set a study goal so Study AI frames answers for your exam or subject track — without changing how you organize files.",
    queries: [
      "exam-aware AI tutor",
      "goal aware study AI",
      "personalized study AI for exams",
      "study goal AI settings",
    ],
    path: "/features/goal-aware-study-ai",
  },
];
