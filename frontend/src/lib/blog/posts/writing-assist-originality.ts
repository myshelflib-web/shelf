import { buildPost } from "../types";

export const writingAssistOriginality = buildPost(
  {
    slug: "paraphrase-and-library-originality",
    title: "Paraphrase Selections and Check Library Originality in Shelf",
    description:
      "Rewrite highlights in your own words, flag overlaps with your Shelf library and syllabus docs, and use Study AI tools — without a web plagiarism vendor yet.",
    excerpt:
      "Select text in a PDF or typed doc to paraphrase or run a library self-check. Study AI can rewrite passages and flag close matches in your notes.",
    publishedAt: "2026-09-07",
    tags: ["study ai", "writing", "highlights", "originality", "docs"],
    readingMinutes: 10,
  },
  [
    {
      heading: "Paraphrase from the selection bar",
      paragraphs: [
        "Highlight a passage in a PDF or HTML page, then choose Paraphrase beside Ask AI. Shelf rewrites the text with Study AI tokens (free plan included, monthly cap). Pick Paraphrase, Simplify, Formal, or Shorten, then copy a variant.",
        "On Doc pages, the editor toolbar has the same paraphraser for the current selection or the whole note, with an Insert action that replaces the selection.",
      ],
    },
    {
      heading: "Originality that fits a personal library",
      paragraphs: [
        "Check originality runs three layers. Library self-check finds close matches in your own uploads via the same vector index Study AI uses — useful when you reuse notes across pages. Syllabus overlap compares wording to relevancy docs you attached in Study AI sources.",
        "Web originality is reserved for Premium and is not connected to a third-party scanner yet. The report says so clearly instead of faking a web scan.",
      ],
    },
    {
      heading: "AI-writing heuristic (optional)",
      paragraphs: [
        "You can include an AI-writing heuristic on the originality report. It uses Study AI tokens and returns a low/medium/high estimate with short signals.",
        "Treat it as a coaching hint only. Short revision notes and formula lists often look “AI-like” even when you wrote them. Shelf never claims a certified detector score.",
      ],
    },
    {
      heading: "Ask in Study AI",
      paragraphs: [
        "In /study-ai, use /paraphrase or /originality with a pasted passage, or ask in plain language. Study AI can call paraphrase_text, check_library_overlap, and check_syllabus_overlap and summarize matches with links back into your library.",
      ],
      bullets: [
        "/paraphrase — rewrite a pasted passage",
        "/originality — library + syllabus overlap summary",
        "Plain English: “flag close matches in my notes for this paragraph”",
      ],
    },
    {
      heading: "Plans and tokens",
      paragraphs: [
        "Paraphrase and the AI heuristic draw from the same monthly Study AI token pool as Ask. Free and Premium caps are unchanged.",
        "Library and syllabus checks are retrieval-heavy; they do not call a paid web plagiarism API. When a vendor is wired later, web scans will stay behind Premium.",
      ],
    },
    {
      heading: "What this is not",
      paragraphs: [
        "Shelf’s originality report is not Turnitin and does not search the public web today. It helps you spot reused personal notes and syllabus phrasing while you write.",
        "Use paraphrase to study in your own words — not to evade academic integrity tools elsewhere.",
      ],
    },
  ]
);
