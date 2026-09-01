import { buildPost } from "../types";

export const currentAffairsIngest = buildPost(
  {
    slug: "current-affairs-dashboard-ingestion",
    title: "Current Affairs Dashboard & Copyright-Safe Ingestion on Shelf",
    description:
      "Shelf pulls government press and official exam updates into a current affairs dashboard — summaries and links only, with admin review and automatic edition archiving.",
    excerpt:
      "Exam-track current affairs from PIB and PRS, plus official syllabus PDF watchers — no newspaper scraping, SQS-backed workers, and a public dashboard at /learn/current-affairs.",
    publishedAt: "2026-09-01",
    updatedAt: "2026-09-01",
    tags: ["learn", "current-affairs", "UPSC", "ingestion", "admin"],
    readingMinutes: 5,
  },
  [
    {
      heading: "What shipped",
      paragraphs: [
        "Shelf now runs a content ingestion pipeline for exams that need current affairs and fresh official documents. The public dashboard lives at /learn/current-affairs, filtered by your study track (UPSC, State PCS, CA, GATE, and more).",
        "Items show a Shelf-written summary, optional short government excerpt, and a link to the official source. We do not republish full newspaper articles.",
      ],
    },
    {
      heading: "Copyright-safe by design",
      paragraphs: [
        "Sources are limited to government press RSS (PIB, PRS), official exam body pages, and redistributable PDFs such as notifications and budget documents.",
        "Third-party coaching sites and newspapers are link-only at most — never full-text stored. Admins review official PDFs before they enter the Learn catalog.",
      ],
    },
    {
      heading: "Automatic syllabus refresh",
      paragraphs: [
        "Yearly sources (Economic Survey, UPSC notification, NCERT portal) are watched for new PDFs. When a new edition appears, older catalog articles are archived — not silently deleted.",
        "Five SQS queues drive poll, fetch, process, promote, and archive phases. See docs/INGEST.md for queue names and environment variables.",
      ],
    },
    {
      heading: "Share, cite, and embed",
      paragraphs: [
        "Every published item has a stable URL at /learn/current-affairs/{slug} with SEO metadata and a NewsArticle schema block for search engines.",
        "Students can copy a citation or share link, read the Shelf summary, and preview the official source in an iframe when the site allows embedding. Broken links are flagged automatically.",
      ],
    },
    {
      heading: "Live news in preloaded Learn",
      paragraphs: [
        "The preloaded Learn explorer now surfaces a Live current affairs strip on the home page and a sidebar link under Browse.",
        "Headlines link to citeable item pages so students can share Shelf URLs while reading summaries tied to official sources.",
      ],
    },
    {
      heading: "How to use it",
      paragraphs: [
        "Students: open Learn → Current affairs (or /learn/current-affairs) and pick your exam track.",
        "Admins: Admin → Ingestion → seed sources, poll, approve pending items, and promote to Learn when ready.",
      ],
    },
  ]
);
