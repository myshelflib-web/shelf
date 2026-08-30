import { buildPost } from "../types";

export const freeCurriculum = buildPost(
  {
    slug: "free-exam-curriculum-learn",
    title: "Free Curriculum Library on Shelf Learn (GATE, UPSC, PCS & More)",
    description:
      "Browse 600+ free curriculum PDFs on Shelf Learn — GATE PYQs, UPSC CSE papers, State PCS, judiciary bare acts, CA, and NEET PG. No sign-in required to read.",
    excerpt:
      "Shelf Learn hosts optional free exam packs: official previous papers, bare acts, NMC docs, and open textbooks. Separate from your private library on /my-content.",
    publishedAt: "2026-02-14",
    updatedAt: "2026-08-30",
    tags: ["learn", "curriculum", "free", "GATE", "UPSC", "exam"],
    readingMinutes: 6,
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
      heading: "Study tracks now live",
      paragraphs: [
        "Each major exam has a dedicated landing page: /learn/tracks/gate, /learn/tracks/upsc, /learn/tracks/state-pcs, /learn/tracks/judiciary, /learn/tracks/ca, and /learn/tracks/neet-pg. These pages summarize what is in the catalog and link into the full subject tree.",
        "The main catalog at /learn lists every subject. Use the track filter or search to narrow down quickly.",
      ],
    },
    {
      heading: "What is in the packs",
      paragraphs: [
        "GATE — hundreds of official previous-year papers plus open engineering textbooks.",
        "UPSC CSE — Prelims/Mains papers, Budget and Economic Survey, Constitution, Yojana, NITI, and related reference PDFs from open-government sources.",
        "State PCS — Tamil Nadu TNPSC official papers and a curated Rajasthan RPSC sample set.",
        "Judiciary — IPC, CrPC, CPC, Companies Act, and Law Commission reports for bare-act study.",
        "CA — open accounting textbooks and Companies Act reference material.",
        "NEET PG — NMC curriculum references, exam notices, and open medical textbooks.",
      ],
    },
    {
      heading: "Reading curriculum articles",
      paragraphs: [
        "Articles render with familiar reader chrome: PDF attachments via presigned URLs with Range fetching, highlights when signed in, and progress tracking for logged-in users.",
        "Every public article has its own URL, meta description, and structured data so search engines can index individual papers and guides.",
      ],
    },
    {
      heading: "When to use Learn vs My Content",
      paragraphs: [
        "Use Learn for shared syllabus-style coverage and official PDFs you should not have to hunt on Telegram. Use My Content for coaching notes, marked-up PDFs, research papers, work docs, and anything Study AI should query privately.",
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
