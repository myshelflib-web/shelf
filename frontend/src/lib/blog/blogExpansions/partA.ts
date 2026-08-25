import type { BlogSection } from "../types";

export const BLOG_EXPANSIONS_A: Record<string, BlogSection[]> = {
  "personal-study-library-collections": [
    {
      heading: "Start with a collection that matches one exam or subject",
      paragraphs: [
        "When you first sign up, resist the urge to mirror your entire hard-drive tree. Create one collection per major subject — Polity, Economy, Essay — and add topics only when a folder would hold more than a dozen pages. Shelf never invents a default General topic, so empty topics never clutter your sidebar.",
        "Root-level pages are perfect for material you reference across subjects: a one-page formula sheet, a news clipping, or a syllabus PDF you open daily. They appear beside collections on /my-content, so you never drill three levels deep for something you use every hour.",
      ],
    },
    {
      heading: "Naming, renaming, and stable links",
      paragraphs: [
        "Titles are for humans; slugs are for URLs. Rename a collection from Polity 2025 to Polity Mains without breaking planner tasks or bookmarks — the slug stays the same under the hood.",
        "If you share a link to a page with a study partner, they see only what your sharing settings allow. Private libraries stay private; curated curriculum on /learn is a separate, admin-published path.",
      ],
    },
    {
      heading: "Pinning and resume reading",
      paragraphs: [
        "Pin collections you are actively revising so they stay at the top of the explorer while you browse the rest of the library. Shelf remembers the last page you opened inside each collection and offers to resume there on any signed-in device once sync completes.",
        "Sort by recent activity when you return from a break — the pages you touched yesterday float up without manual starring.",
      ],
    },
    {
      heading: "Upload paths inside the hierarchy",
      paragraphs: [
        "Upload directly into a topic when you know where a PDF belongs. Upload at collection level when the file spans multiple themes. Upload at library root when you have not decided yet — move or re-title later without re-uploading.",
        "Each page stores one source PDF in object storage. Parsed HTML powers highlights and Study AI; original PDF view stays available when layout matters more than text selection.",
      ],
    },
    {
      heading: "Search across everything you own",
      paragraphs: [
        "Command-palette search (⌘K) indexes titles and, when processing finished, body text from your uploads. Hit Enter on a result to open the reader immediately — no intermediate list view.",
        "Library-wide Study AI chat can answer across collections when you need synthesis: compare two topics, list everything you uploaded about federalism, or draft a revision checklist from your own notes.",
      ],
    },
    {
      heading: "A workflow that scales through the year",
      paragraphs: [
        "Prelims phase: few collections, many root-level current-affairs PDFs. Mains phase: split collections by paper, add topics per syllabus section. Interview phase: pin essay drafts and mock transcripts at collection level.",
        "Shelf grows with you because structure is optional until you need it — not a rigid course catalog you must fill on day one.",
      ],
    },
  ],
  "pdf-reader-highlights-annotations": [
    {
      heading: "Parsed text vs original PDF view",
      paragraphs: [
        "Choose parsed mode when you want selectable text, highlights that export cleanly, and Study AI that reads the same words you see. Choose original PDF when the publisher layout — columns, footnotes, scanned diagrams — matters more than copy-paste.",
        "You can switch modes per page without re-uploading. Processing runs asynchronously after upload; the reader shows progress and opens as soon as bytes are available, then enriches when HTML is ready.",
      ],
    },
    {
      heading: "Highlight colors and meaning",
      paragraphs: [
        "Use colors consistently: yellow for definitions, green for case holdings, pink for doubts to revisit. Highlights persist per page and sync with your account — reopen tomorrow and your markup is exactly where you left it.",
        "Selected text powers Ask Study AI (⌘L): the model receives your highlight as primary context, so explanations stay tied to the passage you marked.",
      ],
    },
    {
      heading: "Pen, eraser, and sketch overlays",
      paragraphs: [
        "On supported pages, draw directly over the document for quick arrows, circles, or handwritten margin notes. Pen mode disables global keyboard shortcuts so keystrokes never jump you out of the reader while you annotate.",
        "Sketch notebooks are separate page types with ruled backgrounds — ideal for diagrams that do not belong on top of a PDF.",
      ],
    },
    {
      heading: "Sidebar, outline, and navigation",
      paragraphs: [
        "Toggle the library sidebar with ⌘B to jump collections without leaving the reader. Arrow keys flip PDF pages; typed page numbers work when you know the exact jump.",
        "Long judgments and textbooks benefit from split view: keep the index or a second PDF open beside the main passage — covered in our workspace article.",
      ],
    },
    {
      heading: "Performance and offline reopen",
      paragraphs: [
        "Large PDFs stream with range requests — you do not wait for the full file before page one renders. Reopen uses an IndexedDB byte cache on your device so repeat visits feel instant even on slow networks.",
        "Install Shelf as a PWA for an app-like reader chrome with less browser UI distraction.",
      ],
    },
    {
      heading: "From reading to revision",
      paragraphs: [
        "Export highlights mentally into Study AI threads: ask for short notes from today's yellow marks, or a mind map linking three cases you highlighted this week.",
        "Link planner tasks to the exact page so Friday's calendar block opens the PDF with highlights already in place — no hunting through folders.",
      ],
    },
  ],
  "study-ai-ask-from-your-pdfs": [
    {
      heading: "How retrieval stays grounded",
      paragraphs: [
        "When you ask a question, Shelf embeds your query and searches indexed chunks from your library — vector similarity when Qdrant is configured, keyword search otherwise. Top passages are injected into the prompt with collection, topic, and page labels.",
        "The model is instructed to prefer those excerpts over general knowledge. If your library has nothing relevant, Study AI says so instead of inventing citations.",
      ],
    },
    {
      heading: "Reader panel vs full workspace",
      paragraphs: [
        "The reader panel is for quick questions while you read — explain this paragraph, define this term, contrast these two sentences. The full /study-ai workspace adds longer threads, image attachments, library scope toggles, and history search.",
        "Page-scoped threads save automatically per document. Library-wide chat starts fresh but can pull from every indexed page you authorize.",
      ],
    },
    {
      heading: "Prompt patterns that work",
      paragraphs: [
        "Ask for exam-shaped outputs: \"List five prelims-style MCQ traps from this chapter,\" or \"Give a 150-word introduction for an essay on this topic using only my notes.\"",
        "Chain questions: first summarize, then ask for a table comparing two sections, then request mnemonics — each turn sees prior answers in the thread.",
      ],
    },
    {
      heading: "Tokens, limits, and Premium",
      paragraphs: [
        "Free tiers include monthly AI token budgets suited to daily revision. Premium expands storage and tokens for heavy library-wide sessions during mains crunch time.",
        "Long PDFs are chunked at index time — you do not paste 200 pages into chat. Retrieval selects the relevant slices automatically.",
      ],
    },
    {
      heading: "Privacy and your data",
      paragraphs: [
        "Questions and answers belong to your account. They are not used to train public models. Uploaded PDFs stay in your private object-storage prefix unless you explicitly use shared curriculum on /learn.",
        "Delete a page and its chunks drop out of search after processing catches up — your library remains yours to curate and purge.",
      ],
    },
    {
      heading: "Study goals shape the voice",
      paragraphs: [
        "Set UPSC, Judiciary, NEET PG, or GATE in Settings and answers adopt the right depth — more case law for Judiciary, more numerical drill for GATE. You can change goals anytime; new messages pick up the latest preference.",
        "Outputs use Markdown headings and tables so you can paste into collection-level doc pages or external notes with minimal reformatting.",
      ],
    },
  ],
  "study-ai-library-wide-chat": [
    {
      heading: "When to lift scope beyond one page",
      paragraphs: [
        "Use page-scoped chat while reading a single judgment. Switch to library-wide when you need synthesis: \"What have I uploaded about cooperative federalism?\" or \"Draft a week revision plan from my Economy folder.\"",
        "Scope controls in the Study AI workspace let you include or exclude collections before sending — narrow scope when answers felt too broad last time.",
      ],
    },
    {
      heading: "Cross-document comparison",
      paragraphs: [
        "Ask Shelf to compare your Laxmikanth highlights with a coaching PDF you uploaded separately — retrieval pulls from both if they are indexed. Request tables: article vs amendment vs case, treaty vs domestic law, theory vs numerical method.",
        "Follow up with \"cite which page each row came from\" to keep yourself honest during revision.",
      ],
    },
    {
      heading: "Thread hygiene",
      paragraphs: [
        "Start a new thread for a new subject — mixing Polity and Ethics in one conversation dilutes retrieval. Title threads by exam or date so history search stays useful months later.",
        "Pin important threads from the dashboard or reopen from recent activity.",
      ],
    },
    {
      heading: "Images and attachments",
      paragraphs: [
        "In the full workspace you can attach screenshots or diagrams to a question — useful when a graph did not OCR well in the PDF. The model sees the image plus retrieved text together.",
        "Keep attachments focused; large images consume tokens faster than text questions.",
      ],
    },
    {
      heading: "Limits of RAG",
      paragraphs: [
        "If a PDF never finished processing, it may be missing from search — check publish status on the page. Scanned books without OCR yield sparse chunks; prefer parsed uploads when possible.",
        "Study AI complements reading; it does not replace working through primary sources yourself.",
      ],
    },
    {
      heading: "Premium depth",
      paragraphs: [
        "Premium subscribers get higher token ceilings for long library-wide sessions — multi-step essay outlines, full mock test analysis across ten uploads, or chapter-wise summary batches in one sitting.",
        "Free users still get meaningful daily use; Premium is for peak-season volume.",
      ],
    },
  ],
  "study-ai-summaries-mind-maps": [
    {
      heading: "One-click summaries from the reader",
      paragraphs: [
        "From a highlight or full page, open Study AI and choose short notes — bullet summaries tuned to your study goal. Long chapters become revision-ready lists you can skim the night before an exam.",
        "Ask for different depths: ultra-short triggers for prelims, paragraph expansions for mains answers.",
      ],
    },
    {
      heading: "Mind maps as structured recall",
      paragraphs: [
        "Mind map mode returns hierarchical Markdown — central concept, branches, leaf facts. Paste into a doc page or screenshot for flashcard apps.",
        "Request \"mind map only from my highlights\" to force the model to respect what you already marked important.",
      ],
    },
    {
      heading: "Combining outputs",
      paragraphs: [
        "Run summary first, then mind map on the summary, then five MCQs — a three-step pipeline in one thread without re-uploading anything.",
        "For law, ask for ratio decidendi maps; for science, ask for formula trees with unit checks.",
      ],
    },
    {
      heading: "Formatting for export",
      paragraphs: [
        "Headings use ## and ### so they paste cleanly into Notion, Obsidian, or Shelf doc pages. Tables appear when comparisons beat bullets.",
        "Copy button on assistant messages reduces friction when building weekly revision sheets.",
      ],
    },
    {
      heading: "Quality tips",
      paragraphs: [
        "Better uploads yield better maps — parsed text beats blurry scans. Split 400-page books into chapter PDFs if you only need one unit this week.",
        "If a map feels generic, select the densest paragraph and ask again with selection context.",
      ],
    },
    {
      heading: "Pair with planner",
      paragraphs: [
        "Schedule \"Mind map: International Relations\" as a Friday task linked to the source PDF. Open from calendar, generate, tick complete — your dashboard streak reflects structured work, not just page flips.",
      ],
    },
  ],
  "goal-aware-study-ai": [
    {
      heading: "Why exam context matters",
      paragraphs: [
        "A Judiciary aspirant needs ratio decidendi and article citations; a NEET PG candidate needs mechanism chains and elimination logic. Generic chatbots guess your level — Shelf reads your goal from Settings and steers tone, length, and jargon.",
        "Goals are per account, not per thread, so every new question inherits the right defaults.",
      ],
    },
    {
      heading: "Supported goals today",
      paragraphs: [
        "UPSC (prelims + mains framing), State Judiciary, NEET PG, GATE, and general study mode cover most Shelf users. Each adjusts prompt templates on the backend — you do not manage system prompts yourself.",
        "Switch goals when your target exam changes; old threads keep their historical answers.",
      ],
    },
    {
      heading: "Answer shapes you will see",
      paragraphs: [
        "UPSC: intro-body-conclusion sketches, directive-word awareness, contemporary link suggestions where your library has current-affairs pages.",
        "Judiciary: issue-wise breakdowns, brief facts, holdings, and distinguishing lines from your case PDFs.",
        "NEET PG / GATE: stepwise reasoning, common traps, formula recall checks.",
      ],
    },
    {
      heading: "Combining with highlights",
      paragraphs: [
        "Highlight a passage, ask with ⌘L, and the goal-aware template wraps your selection — e.g. \"Explain for UPSC prelims MCQ perspective\" without typing boilerplate each time.",
      ],
    },
    {
      heading: "Settings location",
      paragraphs: [
        "Open Settings from the header, pick Study goal, save. Changes apply to the next message in reader panel and full workspace alike.",
        "Goals do not delete or rewrite existing threads.",
      ],
    },
    {
      heading: "Future-proofing your library",
      paragraphs: [
        "Organize PDFs by subject regardless of goal — if you pivot from UPSC to Judiciary, the same Polity uploads stay valid; only answer framing changes.",
        "Premium users running long cross-library sessions benefit most from consistent goal settings across months of threads.",
      ],
    },
  ],
  "planner-tasks-events-calendar": [
    {
      heading: "Tasks vs events",
      paragraphs: [
        "Tasks are checkboxes — finish this chapter, attempt ten MCQs, write one essay draft. Events are calendar blocks with start times — mock test at 10am, coaching class at 6pm.",
        "Both can link to a library page so one click opens the exact PDF or doc you planned to use.",
      ],
    },
    {
      heading: "Week and month views",
      paragraphs: [
        "Week view is the daily driver during active prep: see Friday's polity block beside Saturday's test. Month view helps spot overload weeks before you commit.",
        "Drag is not required — quick-add from the planner board keeps capture fast on mobile.",
      ],
    },
    {
      heading: "Linking pages",
      paragraphs: [
        "When creating a task, pick a page from search — Shelf stores the stable slug. Rename the page later; the task link still resolves.",
        "Open from calendar: reader loads with your last read position when sync is enabled.",
      ],
    },
    {
      heading: "Dashboard integration",
      paragraphs: [
        "Open tasks surface on the signed-in dashboard beside streak stats — you see study debt at a glance without opening planner first.",
        "Completing a task is optimistic in the UI — instant checkmark, API confirms in background.",
      ],
    },
    {
      heading: "Recurring revision",
      paragraphs: [
        "Duplicate weekly tasks for subjects you revisit — \"Revise Economy L1\" every Sunday. Events for fixed coaching schedules sit alongside one-off mocks.",
        "Use tags in titles until native recurrence expands — consistent naming keeps search useful.",
      ],
    },
    {
      heading: "Non-blocking planner",
      paragraphs: [
        "Planner data loads from cache first; refetch never blanks the calendar. Mutations (complete, rename, delete) feel instant with rollback on failure.",
        "That matters on flaky mobile networks during commute planning.",
      ],
    },
  ],
  "study-dashboard-streak-achievements": [
    {
      heading: "What counts as a study day",
      paragraphs: [
        "Shelf tracks meaningful activity — pages opened, highlights added, Study AI questions, tasks completed — not mere logins. Streaks encourage consistency without gamifying empty clicks.",
        "Seven-day streaks show on the dashboard card; longer runs unlock achievement badges over time.",
      ],
    },
    {
      heading: "Pinned and continue reading",
      paragraphs: [
        "Pin pages you revisit daily — fundamental rights, essay outlines, formula sheets. They appear in a dedicated strip so you never dig through collections for habitual reads.",
        "Continue reading picks up the last page you touched anywhere in the library — one tap back into flow.",
      ],
    },
    {
      heading: "Stats that matter",
      paragraphs: [
        "Pages read this week, open planner tasks, and recent Study AI threads give an honest snapshot. Use them for weekly review: did you read a lot but never ask questions? Balance passive and active study.",
      ],
    },
    {
      heading: "Dashboard as home",
      paragraphs: [
        "After sign-in, many users land on /my-content or dashboard depending on flow — both are one click apart. Dashboard is the control room; library is the archive.",
        "Logo click returns to your configured home — usually library for deep work days.",
      ],
    },
    {
      heading: "Achievements without noise",
      paragraphs: [
        "Badges celebrate milestones — first upload, ten-day streak, first mind map — without spammy notifications. They are quiet confidence markers, not social feeds.",
      ],
    },
    {
      heading: "Pair with calendar",
      paragraphs: [
        "If streak breaks, check planner: were tasks unrealistic? Shrink daily targets, link smaller page chunks, and rebuild streak with sustainable 45-minute blocks.",
      ],
    },
  ],
};
