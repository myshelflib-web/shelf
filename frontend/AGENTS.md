# Agent context — frontend

Next.js 15 App Router, React client components where needed, Tailwind + CSS variables in `src/app/globals.css`. Font: **Plus Jakarta Sans** (`--font-sans`). Product name in UI: **Shelf**.

API client: `src/lib/api.ts` (`NEXT_PUBLIC_API_URL`, default `http://localhost:4000`).

## Routes that matter

| Path | Purpose |
|---|---|
| `/dashboard` | Focused home: greeting, search/Ask AI, continue last collection, Next up (max 2 planner actionables), recent collections, paginated achievements. First-time users see Add material instead of empty metrics/cards. **No page scroll** (`h-full overflow-hidden`), same as Library. Still in primary nav. |
| `/planner` | Planner board (week / month) with a To plan backlog. Query: `date=YYYY-MM-DD`, `edit=<taskId>`. `/calendar` redirects here. |
| `/my-content` | **Signed-in home** (Library). Collections + root pages; inside collection, topics + collection pages; topic → pages. Readers: `file/[page]`, `[notebook]/file/[page]`, `[notebook]/[topic]/[page]`. |
| `/settings` | App settings: theme, study goal, reading goal, plan usage. |
| `/profile` | Name, picture, password, delete account. |
| `/study-ai` | Full Study AI (multi-turn chat, RAG, tools, images, save/download). Also `/study-ai/[id]`. Per-thread **library scope** (collection/topic/page) and **syllabus / relevancy docs** (paste or upload; free 10 / paid 50). Stop generation, queue the next message, delete a turn, and preview Mermaid diagrams. Type `/` for slash commands (quiz, mind map, PYQ, flashcards, …); suggestion chips rotate above the composer. Tools can search the library, highlights, recents, starred pages, planner, Google, and public URLs. Reader panel is multi-turn page Ask with the same formatting, and its chats are **saved** as page-scoped threads that appear here. Failed replies stay in the thread. With no highlight, the panel sends this file's vectors plus a snapshot of the visible PDF page when the file has little text. |
| `/learn/...` | Curriculum articles (admin content), not personal collections. |
| `/blog`, `/blog/[slug]` | Public SEO feature guides (marketing). New user-visible features need a post — see `.cursor/rules/feature-blog.mdc`. |

## Header (`Header.tsx`)

Fixed on all pages: `h-12`, `px-5 sm:px-6`, same max width everywhere (no wide variant on Study AI — nav must not jump).

| Control | Component | Behavior |
|---|---|---|
| Search (⌘K / `/`) | `SearchModal` | Command-palette style. Press `?` for the shortcuts cheatsheet. Single-key shortcuts do not fire in inputs, contenteditable, or draw/pen modes. |
| Theme | inline toggle | Light / dark |
| Streak | `StreakPopover` | Flame + count; month calendar, active days, medals |
| Bell | `NotificationsPopover` | **Open tasks only** — due in next 7 days; overdue highlighted; links to planner. No PDF-done / push / Study AI alerts yet. |
| Avatar | `ProfileMenu` | Profile, App settings, Log out |

Nav **Study AI** is `/study-ai` from every window.

## Design conventions

**Palette (Linear / Cursor direction)** — tokens in `globals.css`. Do not revert to the older bright blue (`#9ec4ee`) scheme.

| Token | Dark (primary) | Role |
|---|---|---|
| `--bg-primary` | `#0c0c0d` | Page background |
| `--bg-secondary` / `--bg-elevated` | `#141415` / `#19191b` | Cards, panels |
| `--accent` | `#6e79d6` | Indigo accent (buttons, links, rings) |
| `--text-*` | muted grays | Primary / secondary / muted copy |

- **Surfaces**: flat stat cards (no rainbow gradients), **10px** radius (`rounded-[10px]`), tighter spacing.
- **Library tiles**: no colored washes or left stripe; muted folder tones via `folderTone.ts`.
- **Typography**: `.page-title` (24px semibold) + `.page-subtitle` (14px muted) on Library, Planner, Settings, Profile, Study AI.
- **Modals**: overlay `fixed inset-0 z-[70+]`, dimmed backdrop click-to-close, Escape, `bg-[var(--bg-elevated)]` panel — see `MyContentAddModal`, `CalendarItemModal`, `SearchModal`.
- **Dashboard home**: compact reading/streak pills (hide on first-time empty state). Continue = last-read collection/page. Collections grid = most recently used (compact 3-wide tiles, not stretched). Next up = overdue → today → tomorrow → later, max 2; overflow goes to Planner. No month calendar on the dashboard (streak month lives in the header popover). Achievements = one horizontal row of 8 icon tiles (`n / 8`; dashed = locked, solid + color = earned). Shell is `h-full overflow-hidden` — the page does not scroll. Add material uses `MyContentAddModal` (same as Library).
- **Greeting**: `GreetingBlock` + `useLivelyGreeting` / `livelyCopy` — time-of-day salutation **rotates** (~40s) with soft fade; first name in Fredoka; animated dots. Dashboard greeting is **left-aligned** with metrics on the right. Surface one-liners via `LivelyLine` rotate ~10s on Library, Dashboard, Study AI, Planner, Settings, Profile.

## Command-palette search (`SearchModal`)

Slim input row, keyboard-navigated results list, footer hints (↑↓ / Enter / Esc). Not a fat pill modal. Library hits + optional Study AI suggestions.

## Keyboard (`lib/hotkeys.ts`, `HotkeysProvider`)

Signed-in only. `?` opens the cheatsheet (header keyboard icon). Sequences: `g` then a letter to go; `c` then `n`/`p`/`t` to create. Reader: `⌘L` / `Ctrl+L` asks Study AI with the current selection (Cursor-style); `⌘B` sidebar; `⌘J` Study AI panel; `←`/`→` PDF pages. Do not steal keys while typing.

## Account pages

| Route | Purpose |
|---|---|
| `/settings` | Theme, reading goal, study goal, plan usage |
| `/profile` | Name, avatar, password, delete account (`DELETE /api/auth/me`) |

`AccountNav` toggles between the two pages. Avatar menu links to both.

## Reading & streak

`readingStats.ts` (localStorage): streak, today’s minutes, `activeDates[]` for the streak calendar. Dispatches `shelf:reading-stats-changed` on update. Medals: `streakMedals.ts`.

## Planner & study items

`StudyCalendar` (`src/components/StudyCalendar.tsx`):

- **Dashboard Next up**: max 2 incomplete items (overdue → today → tomorrow → later); day/task click → `/planner?date=` / edit. Full planner lives on `/planner`.
- **Week**: Jira-style board with a **To plan** backlog plus seven day columns. Drag cards between backlog and days.
- **Month**: **this month’s dates only**, grid fills the panel, **no scroll**. Other-month cells empty. At most two items per cell + “+n more”. Drop onto a day to schedule.
- **Task vs event**
  - Task: checkbox, collection/topic/page link. No external URL, no recurrence.
  - Event: calendar styling, optional **https** link, optional **DAILY / WEEKLY / MONTHLY** + until date. No collection pickers.
- Unscheduled items (`dueAt` null) and overdue incomplete tasks sit in **To plan**.
- Create/edit is a **modal** (`CalendarItemModal`) with a Task | Event toggle. Recurring events are expanded by the **backend** for the visible range (`id` may be `uuid::YYYY-MM-DD`; updates/deletes use the master id).

Reading time: `useReadingTimer` on the reader.

## My content

- Signed-in landing: `/` and Shelf logo → `/my-content`. Dashboard remains in the header nav.
- Library mixes **collections + root pages** in the explorer on `/my-content`. Collection/topic routes (`/my-content/[notebook]`, `/my-content/[notebook]/[topic]`) redirect to `/my-content` — the center pane is for **pages only**. Edit a collection (pencil) via `NotebookEditModal` (name, description).
- Readers: `/my-content/file/[page]`, `/my-content/[notebook]/file/[page]`, `/my-content/[notebook]/[topic]/[page]` (`PersonalPageReader` → `ReaderWorkspace`).
- Library home (`/my-content`): Cursor-style empty mid-pane (search all collections + add collection/page) when **no document** is open; if `shelf:reader-workspace` still has open tabs, `/my-content` redirects to the focused tab (Library nav resumes PDFs). Opening a page switches to the reader workspace. Explorer sidebar: sort, paginate, search (`q`), pin recently opened collections so they stay visible across pages, Cursor-style toolbar icons (add page/collection, refresh, collapse all); click collection/topic row to expand (on Library home, expanding a collection also resumes its last page); click page row to open.
- **Reader workspace** (`components/my-content/reader/`): Cursor-like tabs, optional 2-pane side-by-side split, resizable/collapsible library + Study AI panels (`react-resizable-panels`). Tab switches use soft URL updates (`history.replaceState`) so the App Router page does not remount. Up to **12** recently used tabs per pane stay mounted (hidden) so PDFs keep scroll/zoom without reloading; max **15** open tabs. PDF/HTML scroll + page/zoom restore from `localStorage` (`shelf:reader-view-state`) — last PDF page is saved on hide/close and scrolled to on reopen, and synced to the account (`PATCH /api/my-content/pages/:id/progress` + `GET /api/my-content/last-read`) so another device resumes the same page. Last document per collection is in `shelf:notebook-last-read` / `shelf:last-read` (clicking a collection on Library home, `/my-content/[notebook]`, or Continue reading resumes it). PDFs: API returns a presigned S3 GET (`GET /api/my-content/pages/:id/pdf-url`); PDF.js Range-fetches storage (`disableAutoFetch`) so byte chunks stream on demand; after first open, `pdfByteCache` (IndexedDB, LRU ~5 docs / ~80MB) stores the full file so reopen is instant (`getDocument({ data })`). Cleared on logout. Do **not** split PDFs into per-page S3 objects — whole-file Range is the page-by-page network strategy. Canvas pages paint via IntersectionObserver. PDF night mode (moon) inverts page bitmaps. **Focus audio**: Spotify mark in the editor chrome toggles a fixed-width dock beside the document (left of Study AI) — `SpotifyDockPanel` with paste track/playlist/podcast URL → official dark embed (no Shelf OAuth); login happens inside Spotify’s player; last URL + recent + optional per-collection focus playlist in `localStorage` (`shelf:spotify-*`). Hiding the dock (× or toolbar) keeps the embed mounted off-screen so audio continues; a floating chip can restore or stop. The right-panel button toggles Study AI. **Document fullscreen**: Study AI docks beside the document inside the fullscreen element (sparkles in the title bar; ask-from-selection opens it too). URL tracks the **focused** tab; open tabs / layout persist in `localStorage` (`shelf:reader-workspace`). Same page cannot be open twice (focus existing tab). Drag a page from the library sidebar onto a pane/tab strip to open it.
- Reader **Ask AI** (`StudyPanel`): asks send `persist: true` (+ the known `threadId`) to `/api/study/ask/stream`, so each document keeps **one saved page-scoped thread**. Reopening a document restores it via `listChats({ pageId })` + `getChat`, and a “Saved to Study AI · Open chat” row links to `/study-ai/[id]` to continue there. Only text is restored (image attachments are not re-hydrated).
- Reading progress: per-pane scroll % (ref-scoped, not global `.prose-content`); debounced `updateProgress({ readPercent })`. `useReadingTimer` only ticks for the focused pane.
- Add content via `MyContentAddProvider` + `MyContentAddModal` (stay on current page; backdrop closes). Page add works at root, collection (no topic), or topic scope.
- **Rename** (`RenameButton`): hover title → pencil → in-place edit (title becomes input; no duplicate field). Used on sidebar pages/topics and reader title. Collections use `NotebookEditModal` (name + description).
  - API: `PATCH /api/my-content/subjects/:id` (collection name/description), `PATCH …/topic-groups/:id` (topic title), `PATCH /api/my-content/pages/:id/title` (page title).
  - **Titles only** for pages/topics — URL slugs are unchanged after rename; links keep existing slugs.
- **Schedule reading**: reader bottom bar **Schedule** opens `ScheduleReadModal` → creates a calendar **TASK** with `href` to the page. Incomplete scheduled pages show a tiny calendar icon in sidebar lists (`useScheduledPageHrefs`).
- Stars use bright amber when filled.
- Do not add “New collection” in the reader sidebar.
- Pages can be HTML, PDF (`PdfViewer`), or link embed. Highlights: `HighlightToolbar` (colors); PDF pen has S/M/L size and auto-straightens strokes; click a highlight → note modal with **Remove highlight**. PDFs have no **Edit** (bottom bar or `e`). **Add page → Notebook** opens a multi-page sketch editor (draw-only, fixed A4 sheets, ruled/grid/blank paper, GoodNotes-style colors, + Page). **Add page → Doc** opens a typed rich-text editor (headings, lists, fonts, colors — no drawing). Legacy blank canvas pages (combined type+draw) still open via `LiveEditorRouter`. Imported HTML (TXT/MD/DOCX) still uses Edit for read/highlight vs edit.
- PDF bytes: one `source.pdf` per page in S3. Reader uses `GET /api/my-content/pages/:id/pdf-url` (presigned GET, 12h). PDF.js Range-fetches R2/MinIO; bucket CORS must allow GET/HEAD and expose `Content-Range`. `GET|HEAD …/pdf` remains as an API fallback. Frontend IndexedDB (`lib/pdfByteCache.ts`) is the primary smooth-reopen cache.
- Reserved collection/topic slug: `file` (URL segment for loose readers).

## Non-blocking UI

Do **not** block the interface on API calls unless the user cannot proceed without that result. Hydrate from storage/cache, paint chrome immediately, fetch in the background, mutate optimistically. Full-page spinners, refetch overlays, and `await` before navigation are forbidden for secondary data (auth revalidate, planner reload, search, notifications, stars). Details: [`.cursor/rules/non-blocking-ui.mdc`](../.cursor/rules/non-blocking-ui.mdc).

## Checks

`npm run lint --prefix frontend` must be **zero warnings**. Hook deps: prefer `useCallback` over eslint-disable. Dashboard shell stays `h-full overflow-hidden`; the main column may `overflow-y-auto` so focused home sections fit smaller screens. `html`/`body` are `overflow: hidden` + `100dvh`; app shells use `h-full overflow-hidden` (never `h-screen`). Pages that need scroll (settings, profile, marketing) use `h-full overflow-y-auto` on their root.
