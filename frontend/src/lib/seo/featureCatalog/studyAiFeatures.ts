import type { ShelfFeature } from "../featureTypes";

export const STUDY_AI_FEATURES: ShelfFeature[] = [

  {
slug: "study-ai",
    category: "study-ai",
    title: "Study AI — Chat with Your PDFs & Notes | Shelf",
    metaDescription:
      "Study AI on Shelf answers from your uploaded PDFs and notes — not the open web. RAG retrieval, cited excerpts, and exam-aware framing for UPSC, NEET PG, GATE, and more.",
    keywords: [
      "Study AI",
      "chat with PDF",
      "AI study assistant",
      "RAG PDF questions",
      "AI from your notes",
    ],
    headline: "AI that knows your material",
    subhead:
      "Study AI retrieves passages from your library, cites sources, and stays grounded in what you uploaded — with optional syllabus docs for exam framing.",
    bullets: [
      "Quick, Standard, and Deep answer modes (Premium for Standard/Deep)",
      "Library-wide, collection, topic, or page scope",
      "Relevancy / syllabus documents per thread",
      "Summaries, mind maps, and structured notes from pages",
    ],
    paragraphs: [
      "Generic chatbots answer from the internet. Shelf Study AI answers from your coaching PDFs, marked notes, and papers — the material you actually revise.",
      "Free accounts get 50,000 tokens per month; Premium expands to 1 million with deeper indexing and longer chat threads.",
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
      "Highlight a paragraph or ask about the full page on Shelf. Study AI reads your PDF and answers with cited excerpts — summaries, notes, and mind maps included.",
    keywords: [
      "ask AI from PDF highlight",
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
      "Chat across your entire Shelf library, one collection, or a single topic. Multi-turn Study AI threads with RAG retrieval and syllabus doc injection for exam prep.",
    keywords: [
      "AI library search",
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
    title: "AI Summaries & Mind Maps from Your PDFs | Shelf",
    metaDescription:
      "Turn long PDF chapters into revision summaries, bullet notes, or scannable mind maps on Shelf. Outputs stay grounded in your uploaded source material.",
    keywords: [
      "AI summary from PDF",
      "mind map from PDF",
      "PDF to revision notes",
      "chapter summary AI",
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
    relatedBlogSlug: "study-ai-summaries-mind-maps",
    ctaHref: "/login",
    ctaLabel: "Summarize a page",
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
