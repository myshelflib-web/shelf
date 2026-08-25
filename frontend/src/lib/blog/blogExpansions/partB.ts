import type { BlogSection } from "../types";

export const BLOG_EXPANSIONS_B: Record<string, BlogSection[]> = {
  "reader-workspace-tabs-split-view": [
    {
      heading: "Tabs for parallel sources",
      paragraphs: [
        "Open multiple pages in one workspace — judgment in tab one, your summary doc in tab two, bare act in tab three. Switch tabs without losing scroll position per document.",
        "Close tabs you finish; Shelf does not limit reasonable tab counts for desktop study sessions.",
      ],
    },
    {
      heading: "Split view",
      paragraphs: [
        "Drag or use split controls to show two documents side by side — compare versions, copy quotes into notes, or keep Study AI context visible beside PDF.",
        "Split works with mixed types: PDF plus sketch notebook, or two PDFs from different collections.",
      ],
    },
    {
      heading: "Collapsible panels",
      paragraphs: [
        "Hide the library sidebar, Study AI panel, or outline to maximize reading width. Restore with keyboard shortcuts or header toggles.",
        "Panel state persists per session so deep-focus layout returns when you reopen the same page.",
      ],
    },
    {
      heading: "URLs and deep links",
      paragraphs: [
        "Each page has a stable route under /my-content/... — bookmark split layouts indirectly by bookmarking the primary page and reopening tabs from recent history.",
        "Planner links open single pages; add tabs manually for compare sessions.",
      ],
    },
    {
      heading: "Performance with many tabs",
      paragraphs: [
        "Inactive tabs pause heavy work where possible — only the visible PDF actively renders pages. Switching tabs is fast thanks to byte cache.",
      ],
    },
    {
      heading: "Workflow examples",
      paragraphs: [
        "Law: tab one full judgment, tab two your case summary doc, split bare act on the right.",
        "UPSC: tab one coaching notes, tab two previous year questions PDF, Study AI panel for MCQ drills.",
      ],
    },
  ],
  "sketch-notebook-and-doc-pages": [
    {
      heading: "Sketch notebooks",
      paragraphs: [
        "Create ruled notebook pages for freehand diagrams, map sketches, and quick calculations. Pen tools respect palm rejection settings on tablets.",
        "Notebooks live in collections like PDFs — topic or collection level — so Organic Chemistry diagrams stay with Organic Chemistry.",
      ],
    },
    {
      heading: "Typed doc pages",
      paragraphs: [
        "Doc pages are lightweight editors for essay drafts, answer scripts, and revision notes without leaving Shelf. No forced Word export — your text stays in the library beside source PDFs.",
      ],
    },
    {
      heading: "When to sketch vs highlight PDF",
      paragraphs: [
        "Highlight PDF when the source text matters for citations. Sketch when you need spatial layout — geography maps, anatomy, circuit diagrams — that PDF markup cannot capture cleanly.",
      ],
    },
    {
      heading: "Study AI on docs",
      paragraphs: [
        "Indexed doc text participates in library search like PDFs. Ask Study AI to tighten an essay intro using both your draft doc and uploaded reference PDFs.",
      ],
    },
    {
      heading: "Upload alongside create",
      paragraphs: [
        "You can still upload external PDFs; doc pages complement uploads rather than replace them. Many users maintain one doc per collection for running summary notes.",
      ],
    },
    {
      heading: "Device tips",
      paragraphs: [
        "Tablet + stylus shines for sketch notebooks; laptop keyboard shines for doc pages. Same account syncs both.",
      ],
    },
  ],
  "free-exam-curriculum-learn": [
    {
      heading: "/learn vs /my-content",
      paragraphs: [
        "Your private library lives at /my-content — uploads you control. /learn hosts admin-published curriculum: subject trees, official reading lists, and shared PDFs for competitive exams.",
        "They do not mix automatically — import or copy links when you want personal notes beside curriculum.",
      ],
    },
    {
      heading: "Subject and topic trees",
      paragraphs: [
        "Curriculum mirrors real syllabus structure — Polity, Economy, History — with pages authored by Shelf admins or partner educators. Browse without signing in for discovery; sign in to save progress where features allow.",
      ],
    },
    {
      heading: "Using curriculum with your library",
      paragraphs: [
        "Read a /learn page in the same reader chrome as your uploads — highlights and Study AI work when licensing and processing allow.",
        "Build personal collections for mocks and notes; use /learn for baseline material you should not have to hunt on Telegram.",
      ],
    },
    {
      heading: "SEO and sharing",
      paragraphs: [
        "Public curriculum pages are indexable — useful for students finding structured free content. Your /my-content pages stay private unless you explicitly share.",
      ],
    },
    {
      heading: "Updates",
      paragraphs: [
        "When admins publish new pages, they appear in the subject tree — no app update required. Follow Shelf announcements for major syllabus refreshes.",
      ],
    },
    {
      heading: "Who benefits most",
      paragraphs: [
        "Self-study candidates without coaching libraries, rural students with limited PDF access, and anyone wanting a sane default reading list before customizing their own library.",
      ],
    },
  ],
  "shelf-premium-subscription": [
    {
      heading: "What Premium adds",
      paragraphs: [
        "More cloud storage for PDFs and notebooks, higher monthly Study AI token limits, and priority headroom for library-wide chat during intensive revision months.",
        "Free tier remains fully usable for daily study — Premium is volume and convenience, not paywalling core reading.",
      ],
    },
    {
      heading: "Checkout and verification",
      paragraphs: [
        "Subscribe from Settings; payment verification runs server-side. On success you receive a thank-you email with links to deep-dive articles — Study AI, library organization, planner — so you use what you paid for.",
      ],
    },
    {
      heading: "Token budgeting",
      paragraphs: [
        "Tokens measure AI usage — long threads, big attachments, and wide library scope consume more. Dashboard surfaces usage so you are never surprised mid-month.",
        "Premium resets give predictable capacity for mains season.",
      ],
    },
    {
      heading: "Storage reality",
      paragraphs: [
        "Ten gigabytes holds thousands of typical exam PDFs — scanning entire coaching institutes still fits if you prune duplicates. One source.pdf per page keeps storage predictable.",
      ],
    },
    {
      heading: "Cancel and downgrade",
      paragraphs: [
        "Subscription management lives in Settings; downgrade keeps your uploads — you only lose expanded quotas. Export highlights and notes from reader before leaving if you migrate tools.",
      ],
    },
    {
      heading: "When to upgrade",
      paragraphs: [
        "Upgrade when library-wide AI sessions become daily, uploads exceed free storage, or you want zero friction during a six-month pre-mains push. Try free first; Premium meets you at scale.",
      ],
    },
  ],
  "cross-device-reading-progress": [
    {
      heading: "Sync model",
      paragraphs: [
        "Signed-in reading position, highlights, and planner state sync through the API — open laptop after phone session and resume the same PDF page.",
        "Local IndexedDB caches PDF bytes for fast reopen; sync handles metadata and progress separately.",
      ],
    },
    {
      heading: "Conflict behavior",
      paragraphs: [
        "Last-write-wins for page index on simple reopen — rare conflicts when two devices edit simultaneously resolve to the most recent save.",
        "Highlights merge by position; duplicate marks from two devices may need manual cleanup in edge cases.",
      ],
    },
    {
      heading: "Offline and PWA",
      paragraphs: [
        "Cached PDFs open offline; progress queues until reconnect. Install Shelf as PWA on phone and desktop for consistent app shells.",
      ],
    },
    {
      heading: "Account safety",
      paragraphs: [
        "JWT in localStorage — sign out on shared devices. Progress is per account, not per browser fingerprint.",
      ],
    },
    {
      heading: "Multi-device workflows",
      paragraphs: [
        "Commute on phone: read and highlight. Desk on laptop: split view, Study AI, essay doc. Tablet: sketch maps. Same library, same streak.",
      ],
    },
    {
      heading: "Troubleshooting",
      paragraphs: [
        "If progress stalls, check network and token expiry — re-login refreshes session. Force refresh reader if a tab slept for days.",
      ],
    },
  ],
  "keyboard-shortcuts-command-search": [
    {
      heading: "Search modal deep dive",
      paragraphs: [
        "⌘K or / opens SearchModal from almost anywhere signed in. Arrow keys move selection; Enter opens page or collection; Esc closes without navigation.",
        "Results rank recent and title matches — type three letters of a coaching PDF you uploaded last month and jump back instantly.",
      ],
    },
    {
      heading: "Go sequences",
      paragraphs: [
        "Press g then d for dashboard, g then l for library, g then p for planner, g then s for Study AI, g then comma for settings. The sequence window is short — mistypes cancel harmlessly.",
        "Vim-style muscle memory without leaving study flow.",
      ],
    },
    {
      heading: "Reader shortcuts recap",
      paragraphs: [
        "⌘B sidebar, ⌘J Study AI panel, arrows for pages, ⌘L ask on selection. ? opens the cheatsheet modal listing every binding.",
        "Cheatsheet is searchable — type \"split\" to find layout shortcuts.",
      ],
    },
    {
      heading: "Focus safety",
      paragraphs: [
        "Shortcuts never fire in inputs, text areas, contenteditable doc pages, or pen mode — so essay typing and sketching stay safe.",
      ],
    },
    {
      heading: "Platform notes",
      paragraphs: [
        "Mac uses ⌘; Windows and Linux use Ctrl for the same bindings. Browser extensions that capture ⌘K may conflict — disable them on Shelf origin.",
      ],
    },
    {
      heading: "Building habit",
      paragraphs: [
        "First week: force ⌘K instead of mouse for every navigation. Second week: add g-sequences. Third week: reader shortcuts only — you will feel slower going back to generic PDF viewers.",
      ],
    },
  ],
  "spotify-focus-audio-while-reading": [
    {
      heading: "Why audio beside PDF",
      paragraphs: [
        "Some readers focus better with low-volume instrumentals or familiar playlists — not Shelf music, your Spotify account linked in Settings.",
        "Playback controls sit beside the reader so you never alt-tab to Spotify and lose scroll position.",
      ],
    },
    {
      heading: "Setup",
      paragraphs: [
        "Connect Spotify OAuth once; pick a playlist or album for focus sessions. Disconnect anytime from Settings.",
        "Shelf does not store your Spotify password — tokens follow Spotify's OAuth flow.",
      ],
    },
    {
      heading: "Reader layout",
      paragraphs: [
        "Compact now-playing strip — play/pause, skip, volume — keeps chrome minimal. Collapse when you need full width for split view.",
      ],
    },
    {
      heading: "Study etiquette",
      paragraphs: [
        "Lyrics-heavy rap distracts some users; lyric-free focus playlists work best for dense non-fiction. Experiment once, save the playlist ID in your study ritual doc.",
      ],
    },
    {
      heading: "Premium Spotify",
      paragraphs: [
        "Shelf integration assumes a normal Spotify account; ad interruptions are Spotify-side, not Shelf-side.",
      ],
    },
    {
      heading: "Alternatives",
      paragraphs: [
        "No Spotify? Use system audio and reader fullscreen — Shelf does not block other apps. Integration is convenience, not requirement.",
      ],
    },
  ],
  "pwa-offline-study-app": [
    {
      heading: "Install Shelf",
      paragraphs: [
        "Chrome, Edge, and Safari offer Add to Home Screen or Install — Shelf ships a web manifest and icons for app-like launch without an app store.",
        "Installed PWAs open in standalone window — more screen for PDF, less browser tab clutter.",
      ],
    },
    {
      heading: "Offline behavior",
      paragraphs: [
        "Previously opened PDFs cached in IndexedDB reopen offline. New uploads and Study AI need network — plan sync before flights or metro rides.",
      ],
    },
    {
      heading: "Updates",
      paragraphs: [
        "Service worker updates deploy with the site — reload once after Shelf announces features. No manual app store update cycle.",
      ],
    },
    {
      heading: "Mobile vs desktop PWA",
      paragraphs: [
        "Phone install for commute reading; desktop install for distraction-free desk sessions. Same login, same library.",
      ],
    },
    {
      heading: "Storage limits",
      paragraphs: [
        "Browsers cap IndexedDB — Shelf caches recent PDFs intelligently; older caches may evict under pressure. Reopen online to refresh bytes.",
      ],
    },
    {
      heading: "When native apps return",
      paragraphs: [
        "PWA-first lets Shelf ship reader improvements weekly. If a platform store app ships later, your account library remains web-accessible.",
      ],
    },
  ],
};
