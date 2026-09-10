import { longPost } from "../../longPost";

export const storeNotesPdfsAskLlm = longPost(
  {
    slug: "store-notes-pdfs-ask-llm",
    title: "Store All Your Notes and PDFs, Then Ask an LLM",
    description:
      "Looking for a tool to store notes and PDFs and ask an LLM? Shelf keeps your library in one place, then Study AI answers from your uploads with citations — not the open web.",
    excerpt:
      "People search for one app that stores notes and PDFs and lets them ask an LLM. Shelf is that workflow: personal library plus Study AI grounded in your files.",
    publishedAt: "2026-09-11",
    tags: ["Study AI", "LLM", "PDF library", "notes", "how-to"],
  },
  [
    {
      heading: "The problem that query is really asking",
      paragraphs: [
        "When someone types “tool for storing all my notes PDFs and I can ask LLM too,” they want three things at once: durable storage, organization that survives exam season, and an LLM that does not invent answers from the open web.",
        "Generic chatbots fail the storage half. Single-file ChatPDF-style tools fail the library half. Note apps with AI often treat PDFs as second-class. Shelf is built around that combined intent.",
      ],
    },
    {
      heading: "Store first: one personal library",
      paragraphs: [
        "Upload PDFs, typed Docs, sketch notebooks, and YouTube lectures into collections and topics you control. There is no forced General folder — root pages and nested folders map to how you already revise.",
        "Highlights, reading progress, and search stay on your material so the library is useful even before you open Study AI.",
      ],
      bullets: [
        "Collections and topics for coaching PDFs, cases, journals, and work docs",
        "Reader workspace with tabs and split view",
        "Private to your account — you bring the content",
      ],
    },
    {
      heading: "Ask second: Study AI is the LLM layer",
      paragraphs: [
        "Study AI is Shelf’s product name for the LLM that reads your library. It retrieves relevant passages (RAG), cites sources, and answers on a page, a highlight, a collection, or library-wide scope.",
        "You keep saying “LLM” in search; in the product you see Study AI. Same capability — grounded Q&A over your notes and PDFs.",
      ],
    },
    {
      heading: "Why grounding beats paste-into-ChatGPT",
      paragraphs: [
        "Pasting a chapter into a consumer chatbot loses your full corpus, breaks citations, and may conflict with privacy needs for coaching or work documents.",
        "Shelf indexes your published pages so follow-up questions can span multiple files without re-uploading every time.",
      ],
    },
    {
      heading: "Beyond chat: quiz and plan",
      paragraphs: [
        "After you store and ask, Shelf still helps you revise: exam-style quizzes from your notes, and a planner with tasks linked back to pages.",
        "That closes the loop searchers often miss — storage + LLM alone is not enough for serious study weeks.",
      ],
    },
    {
      heading: "How to try the workflow",
      paragraphs: [
        "Create a free account, upload one PDF and one notes page, then open Study AI on the document or at /study-ai with library scope. Ask a question you already know the answer to — check that the citation points at your file.",
        "For a product walkthrough of the intent page, see /features/notes-pdfs-ask-llm. Comparisons to NotebookLM, ChatPDF, and Notion AI are linked from the blog index.",
      ],
    },
  ]
);
