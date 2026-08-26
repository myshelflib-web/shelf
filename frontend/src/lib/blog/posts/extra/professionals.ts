import { longPost } from "../../longPost";

export const professionals = longPost(
  {
    slug: "professionals-work-documents",
    title: "Professionals: A Calm PDF Workspace for Specs, Briefs, and Learning Docs",
    description: "Use Shelf beyond school — organize work PDFs, highlight action items, ask Study AI for summaries of long specs, and schedule deep-work reading on your planner.",
    excerpt: "Collections per client or domain, highlights for decisions and TODOs, Study AI for long RFCs, and planner blocks for deep reading — Shelf as a professional document workspace.",
    publishedAt: "2026-03-07",
    tags: ["professionals","productivity","PDF","workspace"],
  },
  [
    {
      heading: "Work is also a library problem",
      paragraphs: [
        "Specs, vendor PDFs, onboarding manuals, and industry reports pile up like student notes. Shelf gives them a private home with search and AI that stays on your files.",
        "Create collections per client, product area, or certification you are pursuing.",
      ],
    },
    {
      heading: "Action-oriented highlights",
      paragraphs: [
        "Color for decisions, risks, and follow-ups. Ask Study AI: List open action items from this highlighted section as a checklist.",
        "Paste checklists into planner tasks with due dates.",
      ],
    },
    {
      heading: "Long RFC and contract skims",
      paragraphs: [
        "Upload the PDF, ask for a short executive summary from page context, then verify critical clauses yourself in original view.",
        "Split view: contract and your notes doc for redlines you will send elsewhere.",
      ],
    },
    {
      heading: "Certification and CPD",
      paragraphs: [
        "Professionals studying for PMP, CFA, cloud certs, or medical CME can keep course PDFs beside work collections — same highlights and planner tools.",
      ],
    },
    {
      heading: "Focus without social feeds",
      paragraphs: [
        "Shelf is not a feed. Open a document, read, annotate, leave. Pair with Spotify focus audio if that helps your deep-work ritual.",
      ],
    },
    {
      heading: "Device boundaries",
      paragraphs: [
        "Sign out on shared machines. JWT lives in localStorage — treat work devices carefully.",
      ],
    },
    {
      heading: "Premium when volume grows",
      paragraphs: [
        "Heavy AI summarization of long corpora and large storage footprints are where Premium helps. Free tier covers light professional use.",
      ],
    },
    {
      heading: "Keep personal and work separate",
      paragraphs: [
        "Use separate collections with clear names. Optionally different accounts if your org requires stricter separation.",
      ],
    }
  ]
);
