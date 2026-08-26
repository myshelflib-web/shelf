import { longPost } from "../../longPost";

export const vsChatbots = longPost(
  {
    slug: "shelf-vs-generic-chatbots",
    title: "Shelf Study AI vs Generic Chatbots: Why Grounding in Your PDFs Matters",
    description: "Compare asking ChatGPT-style tools versus Shelf Study AI that retrieves from your uploaded PDFs and notes — with workflows for students and professionals.",
    excerpt: "Generic chatbots guess from the open web. Shelf Study AI answers from your library with retrieval and citations back to your pages — better for exam and work accuracy.",
    publishedAt: "2026-03-10",
    updatedAt: "2026-08-26",
    tags: ["Study AI","comparison","RAG","productivity"],
  },
  [
    {
      heading: "The hallucination problem on exams and work",
      paragraphs: [
        "Generic models invent citations and mix textbooks. When your grade or job depends on a specific PDF, you need answers tied to that file.",
        "Shelf embeds your query, retrieves chunks from your indexed pages, and instructs the model to prefer those excerpts.",
      ],
    },
    {
      heading: "When generic chat is still fine",
      paragraphs: [
        "Brainstorming essay structures, learning a brand-new concept with no source PDF, or casual curiosity — public chatbots are fine.",
        "Switch to Shelf when the source of truth is a document you own.",
      ],
    },
    {
      heading: "Selection-aware questions",
      paragraphs: [
        "Highlight a paragraph and ask with ⌘L. The model sees that passage as primary context — something paste-into-ChatGPT workflows forget.",
      ],
    },
    {
      heading: "Library-wide synthesis",
      paragraphs: [
        "Ask across a collection: What have I uploaded about federalism? or Summarize open risks in these three RFCs. Scope controls prevent unrelated folders from leaking in.",
      ],
    },
    {
      heading: "Privacy difference",
      paragraphs: [
        "Pasting a confidential brief into a consumer chatbot may train or log content under that vendor’s terms. Shelf keeps Q&A on your account-scoped material.",
      ],
    },
    {
      heading: "Workflow pairing",
      paragraphs: [
        "Use generic AI for outline ideas; use Shelf to force every claim back to your highlighted sources before you submit.",
      ],
    },
    {
      heading: "Limits to know",
      paragraphs: [
        "Very large scanned PDFs may skip OCR (size cap); the reader still attaches the visible page image. If nothing matches your question, Study AI should say so — that honesty is a feature.",
      ],
    },
    {
      heading: "Premium headroom",
      paragraphs: [
        "Long multi-document sessions consume tokens. Premium raises monthly budgets for thesis or mains-season volume.",
      ],
    }
  ]
);
