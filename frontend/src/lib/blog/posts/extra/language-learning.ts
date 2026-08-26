import { longPost } from "../../longPost";

export const languageLearning = longPost(
  {
    slug: "language-learning-with-pdfs",
    title: "Language Learners: Annotate Textbooks and Readers in a Personal PDF Library",
    description: "Use Shelf to organize language textbooks, graded readers, and grammar PDFs — highlight vocabulary, ask Study AI for explanations, and schedule practice on the planner.",
    excerpt: "Collections per language, topics per skill, vocabulary highlights, and AI explanations grounded in your textbook pages — Shelf for language study beyond flashcard apps.",
    publishedAt: "2026-03-13",
    tags: ["language learning","textbooks","vocabulary","students"],
  },
  [
    {
      heading: "One collection per language",
      paragraphs: [
        "Spanish, French, Japanese — separate collections. Topics for Grammar, Reading, Listening transcripts, and Exam prep.",
        "Upload textbook chapters and graded readers as individual pages.",
      ],
    },
    {
      heading: "Vocabulary highlights",
      paragraphs: [
        "Mark unknown words in one color and idioms in another. Ask Study AI: Explain this highlighted phrase in simpler language using nearby context from the page.",
        "Keep a running vocab doc page per topic for weekly review.",
      ],
    },
    {
      heading: "Grammar reference beside practice",
      paragraphs: [
        "Split view: grammar PDF and exercise worksheet. Or grammar and a graded reader where the structure appears in the wild.",
      ],
    },
    {
      heading: "Listening transcripts",
      paragraphs: [
        "Upload transcript PDFs for podcasts or course audio you store elsewhere. Highlight while replaying audio outside Shelf.",
      ],
    },
    {
      heading: "Planner for immersion blocks",
      paragraphs: [
        "Daily 20-minute reading tasks linked to the current reader page beat vague study later goals.",
      ],
    },
    {
      heading: "AI caveats for languages",
      paragraphs: [
        "Verify conjugations and tones against trusted references. Use Study AI for intuition and paraphrase, not as sole authority.",
      ],
    },
    {
      heading: "Travel and offline",
      paragraphs: [
        "Cache readers before flights with PWA offline reopen for previously opened PDFs.",
      ],
    },
    {
      heading: "Pair with SRS apps",
      paragraphs: [
        "Export mentally: turn Shelf highlights into Anki cards. Shelf holds the source context; SRS holds the drill.",
      ],
    }
  ]
);
