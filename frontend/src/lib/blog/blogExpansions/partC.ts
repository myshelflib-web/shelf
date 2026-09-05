import type { BlogSection } from "../types";

export const BLOG_EXPANSIONS_C: Record<string, BlogSection[]> = {
  "study-ai-planner-quiz-actions": [
    {
      heading: "What Study AI can create",
      paragraphs: [
        "Chat tools can add planner tasks and events, set reminders with due times, and kick off quiz generation without leaving the conversation. Confirmations come back in the thread with links to /planner or /quiz/:id.",
        "If a request is ambiguous, Study AI asks a short follow-up before writing to your account so you do not get surprise calendar spam.",
      ],
    },
    {
      heading: "Reader panel vs full Study AI",
      paragraphs: [
        "The document Ask panel is ideal when the open PDF is the focus but you still want a quick reminder or quiz on that page. Full /study-ai is better for library-wide scope, multi-turn planning, and longer action chains.",
        "Both surfaces share the same tools and quotas, so actions you start in the reader show up in the same planner and quiz lists.",
      ],
    },
    {
      heading: "Safety and undo",
      paragraphs: [
        "Destructive deletes are limited; Study AI prefers create and update. You can edit or delete planner items on /planner and abandon quizzes from the Quiz workspace if a draft is wrong.",
        "Actions use your signed-in account only. Shared pages do not let collaborators trigger planner writes on the owner’s calendar through Ask.",
      ],
    },
    {
      heading: "When retrieval still matters",
      paragraphs: [
        "Even for general questions, Study AI searches your library when it helps. Action requests like “quiz me on this chapter” still use the page or collection you named so questions stay on syllabus.",
        "Thin or scanned PDFs rely on OCR text and the visible page snapshot the same way regular Ask does.",
      ],
    },
    {
      heading: "Plans and limits",
      paragraphs: [
        "Quiz generation and chat both draw from your Study AI token allowance. Free and Premium caps are unchanged — actions do not unlock a separate pool.",
        "If you hit the monthly limit mid-action, the chat explains the block and points you to upgrade or wait for the reset window.",
      ],
    },
    {
      heading: "Example prompts",
      paragraphs: [
        "Try “remind me to revise Article 14 tomorrow evening,” “add an unscheduled task to outline this judgment,” or “create a hard 10-question MCQ quiz on this PDF.”",
        "Combine intent with scope: “quiz on my Polity collection, medium difficulty” from library chat, or “schedule reading this page for Saturday morning” from the reader.",
      ],
    },
  ],
  "study-ai-depth-modes": [
    {
      heading: "Standard vs Quick in practice",
      paragraphs: [
        "Quick mode is still the default for everyday questions — define a term, check a formula, or queue a follow-up while a reply streams. Standard is the sweet spot when you want a complete explanation with tables and a recap without waiting for a full-book pass.",
        "Switch depth before you send; it applies to that message only in the thread (your choice is remembered for the next question). Slash commands like /explain and /compare respect the depth you picked.",
      ],
    },
    {
      heading: "Deep mode and Premium",
      paragraphs: [
        "Deep requires Premium because it runs more model calls and a higher output token ceiling. Free users can still use Standard for noticeably longer answers than Quick.",
        "Token usage scales with depth — a Deep map-reduce summary on a long textbook may consume several times a Quick reply. Check Settings for your monthly Study AI allowance.",
      ],
    },
    {
      heading: "Slash commands for long outputs",
      paragraphs: [
        "/deep-summary on an open page triggers chapter-wise synthesis when the file is long. /chapter-notes, /analyze, and /mains expand into long-form prompts tuned for revision and exam tracks.",
        "Combine depth with scope: library chat with Standard can pull across a collection; reader Deep focuses on the indexed chunks of the open PDF.",
      ],
      bullets: [
        "/deep-summary — full document, section by section",
        "/chapter-notes — one heading per chapter",
        "/mains — long-form answer skeleton",
        "/analyze — themes, evidence, gaps",
      ],
    },
    {
      heading: "What Deep does not replace",
      paragraphs: [
        "Study AI still grounds answers in indexed text. Scanned PDFs without OCR remain thin until processing finishes. Deep reads more of what is indexed — it does not invent pages you never uploaded.",
        "For the hardest judgment or proof work, pair Deep summaries with your own highlights and planner sessions. The depth toggle makes answers longer and more structured; you still choose what to memorize.",
      ],
    },
  ],
  "youtube-lectures-in-your-library": [
    {
      heading: "Add a lecture or a playlist",
      paragraphs: [
        "Open Add page and choose YouTube. Paste a watch URL for one lecture, or a playlist URL to import the course. Titles come from YouTube when you leave the title field blank.",
        "Inside a collection, a playlist becomes a new topic. At the library root, it becomes a new collection. Videos already inside a topic are added as pages in that topic, in playlist order.",
      ],
    },
    {
      heading: "Timestamped notes",
      paragraphs: [
        "Stamp writes the current time into the notes doc under the player as a 12:34 link. Click it later to seek. Use stamps for definitions, PYQ hints, or anything the teacher repeats.",
        "Notes autosave like other Shelf docs. They are indexed with the lecture title and URL so Study AI can use what you wrote — not a full transcript of the video.",
      ],
    },
    {
      heading: "Split with the matching PDF",
      paragraphs: [
        "Drop a textbook or coaching PDF onto the other pane while the lecture plays. Each pane keeps its own place. That is the point of putting video in the library instead of a second app.",
        "Schedule the lecture from the reader bottom bar the same way you schedule a PDF. Resume time syncs across devices like last-read page.",
      ],
    },
    {
      heading: "Playlists and YouTube limits",
      paragraphs: [
        "Shelf never downloads the file. Playback uses YouTube's player. Videos that disable embedding still keep your notes; use Open on YouTube for those.",
        "Without a server YouTube Data API key, public playlist feeds include about the first 15 videos. Paste remaining watch URLs, or configure YOUTUBE_API_KEY for a fuller import (capped at 80 lectures).",
      ],
    },
    {
      heading: "What this is not",
      paragraphs: [
        "Shelf is not a YouTube search engine or a coaching catalog. You bring the lectures you already chose — the same rule as PDFs.",
        "Private or unlisted videos follow YouTube's own login inside the player. Shelf does not store YouTube passwords.",
      ],
    },
    {
      heading: "Study loop",
      paragraphs: [
        "Watch, stamp, highlight the matching PDF, ask Study AI on your notes, then schedule the next lecture. Streak minutes include time on a focused video page the same way they include reading.",
      ],
    },
  ],
  "official-exam-syllabus-pdfs": [
    {
      heading: "Where to find it",
      paragraphs: [
        "Signed-in: Library → Preloaded → Browse → Syllabus. Guests: the same explorer on /learn. The row sits with Current affairs and your exam track — it does not replace generated starter packs.",
        "If your study goal is UPSC, you still see UPSC collections. Syllabus is extra, so you can open a GATE or CA official PDF without changing Settings.",
      ],
    },
    {
      heading: "How files get there",
      paragraphs: [
        "Shelf lists official syllabus objects already stored for each exam and publishes them as normal Learn articles with a PDF. There is no separate viewer and no new URL scheme beyond /learn/{exam-syllabus}/…",
        "When an exam has no official file in storage yet, that exam is omitted. The section appears only when at least one PDF is available.",
      ],
    },
    {
      heading: "Reading and saving",
      paragraphs: [
        "Open a syllabus PDF the same way you open any public article: middle pane in Library browse, or a workspace tab if you already have files open. Highlights and Study AI work on the official file just as they do on other public PDFs.",
        "Save to Library when you want a personal copy for notes. That uses the existing save-to-library path — it does not rewrite your collections or starter-pack pages.",
      ],
    },
    {
      heading: "What did not change",
      paragraphs: [
        "Tab close, last-PDF-returns-to-browse, guest scroll, Study skills on every track, and Current affairs are the same. Syllabus is an additive Browse section only.",
        "Generated starter-pack pages remain HTML study notes mapped to syllabus headings. Official PDFs are the source documents; packs are the teaching layer.",
      ],
    },
  ],
};
