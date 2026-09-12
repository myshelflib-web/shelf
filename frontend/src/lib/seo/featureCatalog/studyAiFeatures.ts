import type { ShelfFeature } from "../featureTypes";

export const STUDY_AI_FEATURES: ShelfFeature[] = [
  {
    slug: "chat-with-pdf",
    category: "study-ai",
    title: "Chat with PDF AI — Ask Questions on Your Uploads | Shelf",
    metaDescription:
      "Chat with PDF using Shelf Study AI: upload textbooks and notes, ask questions, get cited answers, summarize chapters, and continue across your whole library — free plan included.",
    keywords: [
      "chat with PDF",
      "chat with PDF AI free",
      "PDF chatbot",
      "ask questions about PDF",
      "talk to PDF AI",
      "PDF Q&A AI",
    ],
    headline: "Chat with your PDFs — not the open web",
    subhead:
      "Upload a PDF (or a whole collection), then ask Study AI anything about it. Answers retrieve from your file with citations so you can jump back to the page.",
    bullets: [
      "Ask on a highlight, a page, or library-wide chat",
      "Cited excerpts from your uploads",
      "Summaries, notes, mind maps, and follow-ups in one thread",
      "Free Study AI limits; Premium for heavier daily use",
    ],
    paragraphs: [
      "“Chat with PDF” tools usually stop at one file. Shelf keeps chat inside a personal study library so tomorrow’s question can span last month’s notes too.",
      "Students use it for homework grounded in class PDFs; teachers use it to probe worksheets before turning them into quizzes.",
    ],
    relatedBlogSlug: "chat-with-pdf-ai",
    ctaHref: "/login?next=/study-ai",
    ctaLabel: "Chat with a PDF",
    secondaryCtaHref: "/features/study-ai",
    secondaryCtaLabel: "All Study AI features",
  },
  {
    slug: "ai-tutor",
    category: "study-ai",
    title: "AI Tutor from Your Notes & PDFs | Shelf Study AI",
    metaDescription:
      "Personal AI tutor for students: Shelf Study AI explains concepts from your textbooks and notes, walks through problems, and cites your uploads — not random web pages.",
    keywords: [
      "AI tutor for students",
      "personal AI tutor free",
      "AI tutor from my notes",
      "AI study buddy",
      "virtual tutor PDF",
      "AI teaching assistant students",
    ],
    headline: "An AI tutor that read your syllabus",
    subhead:
      "Study AI tutors from the PDFs and notes you uploaded. Ask “explain this like I’m revising tonight” and get answers tied to your material.",
    bullets: [
      "Concept explanations grounded in your textbook PDF",
      "Homework help that cites class notes",
      "Optional syllabus / relevancy docs per thread",
      "Depth modes for quick lookup vs deep tutoring (Premium)",
    ],
    paragraphs: [
      "Generic AI tutors invent steps. Shelf’s AI tutor retrieves from your library first — better when marks depend on a specific coaching PDF or lecturer handout.",
    ],
    relatedBlogSlug: "ai-tutor-from-notes",
    ctaHref: "/login?next=/study-ai",
    ctaLabel: "Open AI tutor",
  },
  {
slug: "study-ai",
    category: "study-ai",
    title: "Study AI — Ask an LLM About Your PDFs & Notes | Shelf",
    metaDescription:
      "Ask Study AI — Shelf’s LLM grounded in your library — about uploaded PDFs and notes. RAG retrieval, cited excerpts, and chat-with-PDF for study, research, and exams.",
    keywords: [
      "Study AI",
      "ask LLM about PDFs",
      "chat with PDF",
      "AI study assistant",
      "AI tutor for students",
      "RAG PDF questions",
      "LLM grounded in library",
      "AI from your notes",
    ],
    headline: "An LLM that knows your material",
    subhead:
      "Study AI is Shelf’s LLM layer: it retrieves passages from your library, cites sources, and stays grounded in what you uploaded — with optional syllabus docs for exam framing.",
    bullets: [
      "Quick, Standard, and Deep answer modes (Premium for Standard/Deep)",
      "Library-wide, collection, topic, or page scope",
      "Relevancy / syllabus documents per thread",
      "Summaries, mind maps, and structured notes from pages",
    ],
    paragraphs: [
      "Generic chatbots answer from the internet. Shelf Study AI answers from your coaching PDFs, marked notes, and papers — the material you actually revise.",
      "Free includes Study AI for everyday questions. Premium adds higher usage, Standard & Deep modes, and more headroom for large libraries.",
    ],
    relatedBlogSlug: "study-ai-ask-from-your-pdfs",
    ctaHref: "/login?next=/study-ai",
    ctaLabel: "Try Study AI",
    secondaryCtaHref: "/subscribe",
    secondaryCtaLabel: "View Premium limits",
  },
{
    slug: "study-ai-page-ask",
    category: "study-ai",
    title: "Ask Study AI on a PDF Page or Highlight | Shelf",
    metaDescription:
      "Highlight a paragraph or ask about the full page on Shelf. Study AI — an LLM on your PDF — answers with cited excerpts, summaries, notes, and mind maps.",
    keywords: [
      "ask AI from PDF highlight",
      "ask LLM about PDF page",
      "summarize PDF page",
      "mind map from PDF",
      "PDF question answering",
    ],
    headline: "Ask on a selection or the whole page",
    subhead:
      "The reader panel's Study AI dock handles quick questions without leaving the document — summarize, bullet notes, mind maps, or free-form ask.",
    bullets: [
      "Highlight → Ask on selection",
      "Page-level summarize, notes, and mind map actions",
      "Cited answers from the open document",
      "Same tools in fullscreen reading mode",
    ],
    paragraphs: [
      "Micro-questions while reading — 'explain this clause', 'three bullet revision points', 'mind map this section' — stay in context beside the PDF.",
    ],
    relatedBlogSlug: "study-ai-ask-from-your-pdfs",
    ctaHref: "/login",
    ctaLabel: "Upload a PDF",
  },
{
    slug: "study-ai-library-chat",
    category: "study-ai",
    title: "Library-Wide Study AI Chat with Scope Filters | Shelf",
    metaDescription:
      "Ask an LLM across your entire Shelf library, one collection, or a topic. Multi-turn Study AI threads with RAG retrieval and syllabus docs for exam prep.",
    keywords: [
      "AI library search",
      "ask LLM across PDFs",
      "cross document AI chat",
      "PDF corpus question answering",
      "syllabus aware AI tutor",
    ],
    headline: "Chat across your library",
    subhead:
      "The /study-ai workspace is multi-turn chat with scope filters — LIBRARY, NOTEBOOK, TOPIC, or PAGE — plus optional relevancy documents.",
    bullets: [
      "Compare themes across multiple PDFs in one thread",
      "Attach syllabus text so answers match your exam",
      "30 messages per thread free; 300 on Premium",
      "Server-side history with automatic trimming",
    ],
    paragraphs: [
      "When revision spans an entire subject folder, page-level ask is not enough. Library-scoped chat retrieves the right excerpts from every indexed document in that scope.",
    ],
    relatedBlogSlug: "study-ai-library-wide-chat",
    ctaHref: "/login?next=/study-ai",
    ctaLabel: "Open Study AI workspace",
  },
{
    slug: "study-ai-summaries",
    category: "study-ai",
    title: "AI PDF Summarizer & Mind Maps from Your Uploads | Shelf",
    metaDescription:
      "AI PDF summarizer for students: turn long chapters into revision summaries, bullet notes, or mind maps on Shelf — grounded in your textbook, not the open web.",
    keywords: [
      "AI PDF summarizer",
      "summarize PDF AI free",
      "mind map from PDF",
      "PDF to revision notes",
      "chapter summary AI",
      "PDF to notes AI",
    ],
    headline: "Summarize, note, or mind-map a page",
    subhead:
      "One-click actions in the reader transform dense PDFs into recap formats you can skim before exams.",
    bullets: [
      "Structured summaries tied to source pages",
      "Bullet revision notes from selections",
      "Mind maps for visual recall",
      "Mermaid diagram preview in chat when useful",
    ],
    paragraphs: [
      "Shelf generates study aids from your files — not generic web summaries — so terminology matches your coaching material and textbooks.",
    ],
    relatedBlogSlug: "ai-pdf-summarizer-students",
    ctaHref: "/login",
    ctaLabel: "Summarize a PDF",
  },
{
    slug: "study-ai-depth-modes",
    category: "study-ai",
    title: "Study AI Depth Modes — Quick, Standard & Deep | Shelf",
    metaDescription:
      "Choose Quick, Standard, or Deep Study AI answers on Shelf. Deeper modes use more capable models for analysis, mains-style depth, and longer PDF synthesis.",
    keywords: [
      "deep PDF analysis AI",
      "long PDF summary AI",
      "UPSC mains answer AI",
      "study AI depth modes",
    ],
    headline: "Match depth to the question",
    subhead:
      "Quick for fast lookups; Standard and Deep (Premium) for longer reasoning, multi-step analysis, and exam-grade explanations.",
    bullets: [
      "Quick — fast answers on free and Premium",
      "Standard — balanced depth (Premium)",
      "Deep — longest context and reasoning (Premium)",
      "Pick per message in the Study AI panel",
    ],
    paragraphs: [
      "A definition lookup should not burn the same tokens as a mains-style essay outline. Depth modes let you trade speed for thoroughness when it matters.",
    ],
    relatedBlogSlug: "study-ai-depth-modes",
    ctaHref: "/subscribe",
    ctaLabel: "Upgrade for Standard & Deep",
  },
{
    slug: "goal-aware-study-ai",
    category: "study-ai",
    title: "Goal-Aware Study AI for UPSC, NEET PG, GATE & More | Shelf",
    metaDescription:
      "Set your study goal on Shelf so Study AI frames answers for UPSC, State PCS, Judiciary, CA, NEET PG, or GATE — without changing how you organize files.",
    keywords: [
      "UPSC study AI",
      "NEET PG AI tutor",
      "GATE exam AI",
      "exam aware AI assistant",
      "goal aware study AI",
    ],
    headline: "Answers framed for your exam",
    subhead:
      "Pick a study goal in Settings. Study AI and Quiz adjust tone, structure, and terminology to match your track.",
    bullets: [
      "UPSC, State PCS, Judiciary, CA, NEET PG, GATE, General",
      "Quiz stems follow the same goal context",
      "Works with private uploads — not a fixed content catalog",
      "Change goal anytime without moving files",
    ],
    paragraphs: [
      "The same Constitutional Law PDF needs different framing for judiciary prelims versus law school coursework. Goal settings steer AI output without reorganizing your library.",
    ],
    relatedBlogSlug: "goal-aware-study-ai",
    ctaHref: "/login",
    ctaLabel: "Set your study goal",
  },
{
    slug: "study-ai-chat-controls",
    category: "study-ai",
    title: "Study AI Chat Controls — Stop, Queue & Diagrams | Shelf",
    metaDescription:
      "Stop streaming replies, queue follow-up messages, preview Mermaid diagrams, and run web search from Shelf Study AI chat when you need broader context.",
    keywords: [
      "stop AI generation",
      "queue chat messages",
      "mermaid diagram study AI",
      "study AI controls",
    ],
    headline: "Control the conversation",
    subhead:
      "Stop a long reply, queue the next question, expand diagrams inline, and use tools when library retrieval alone is not enough.",
    bullets: [
      "Stop streaming mid-answer",
      "Queue messages while AI is thinking",
      "Mermaid diagram rendering in chat",
      "Optional web search tool for broader facts",
    ],
    paragraphs: [
      "Study sessions are messy — you change your mind mid-stream. Shelf gives you chat controls comparable to developer tools, tuned for long study threads.",
    ],
    relatedBlogSlug: "study-ai-stop-queue-diagrams",
    ctaHref: "/login?next=/study-ai",
    ctaLabel: "Open Study AI",
  },
{
    slug: "study-ai-actions",
    category: "study-ai",
    title: "Study AI Actions — Tasks, Reminders & Quizzes | Shelf",
    metaDescription:
      "Ask Shelf Study AI to add planner tasks, set reminders, or start a quiz from chat. Bridge reading, planning, and practice without leaving the conversation.",
    keywords: [
      "AI study planner",
      "remind me study app",
      "quiz from chat",
      "study AI actions",
    ],
    headline: "From chat to calendar and quiz",
    subhead:
      "Say 'remind me tomorrow' or 'make a quiz on this chapter' — Study AI can create planner items and open Quiz scoped to your material.",
    bullets: [
      "Create tasks and reminders from chat",
      "Launch exam-style quizzes from a thread",
      "Works in reader panel and /study-ai workspace",
      "Still grounds answers in your library when relevant",
    ],
    paragraphs: [
      "Reading and planning should not live in separate apps. Study AI actions connect what you learn to what you schedule and how you test yourself.",
    ],
    relatedBlogSlug: "study-ai-planner-quiz-actions",
    ctaHref: "/login?next=/study-ai",
    ctaLabel: "Try Study AI actions",
  },
];
