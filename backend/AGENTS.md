# Agent context — backend

Express + TypeScript (`"type": "module"`), Prisma 6, PostgreSQL. Entry: `src/index.ts` (default port **4000**). Auth middleware on user routes; JWT `req.user.userId`.

## Route map

| Prefix | File | Notes |
|---|---|---|
| `/api/auth` | `routes/auth.ts` | Register, login, Google, Telegram Login Widget, `PATCH /me`, `DELETE /me` |
| `/api/telegram` | `routes/telegram.ts` | Bot webhook (PDF ingest), `POST /share-page` (send a library PDF back), link/unlink/status for Settings |
| `/api/my-content` | `routes/myContent.ts`, `routes/myContentYoutube.ts` | Collections, topics, pages, uploads, highlights, clips; `POST /youtube` imports a YouTube video or playlist as `VIDEO` pages; library files use `POST /uploads/init` (presigned S3 PUT) then `POST /uploads/complete`; PDF reads use `GET …/pages/:id/pdf-url` (presigned S3 GET, browser Range); `GET/HEAD …/pages/:id/pdf` remains as a fallback stream; `GET /last-read` + `PATCH …/pages/:id/progress` `{ view }` sync reading position across devices |
| `/api/study` | `routes/study.ts`, `routes/studyChats.ts` | Page Ask + `library-ask` RAG; chat threads |
| `/api/quiz` | `routes/quiz.ts` | Generate/take/grade quizzes (library, upload, exam bank); MCQ auto-grade; written/image via vision LLM |
| `/api/tasks` | `routes/tasks.ts` | Tasks **and** events |
| `/api/subjects` | `routes/subjects.ts` | Curriculum (admin catalog); PDF reads use `GET …/articles/:slug/pdf-url` (presigned S3 GET); `GET/HEAD …/pdf` remains as a fallback stream |
| `/api/admin` | `routes/admin.ts` | Admin PDF upload / catalog |
| `/api/highlights` | `routes/highlights.ts` | Curriculum article highlights |
| `/api/progress` | `routes/progress.ts` | Curriculum progress |
| `/api/subscription` | `routes/subscription.ts`, `subscriptionRecurring.ts` | Plans, coupons at checkout, one-time orders, UPI Autopay monthly/yearly, webhook |
| `/api/affiliate` | `routes/affiliate.ts` | User affiliate code + coin balance |
| `/api/admin/coupons` | `routes/adminCoupons.ts` | Admin coupon CRUD + affiliate summary |
| `/api/blog` | `routes/blog.ts` | Public blog list, post, S3 media |
| `/api/admin/blog` | `routes/adminBlog.ts` | Admin blog CRUD + cover upload |
| `/api/internal` | `routes/internal.ts` | Processor callbacks (shared secret) |

Health: `GET /health`, `GET /metrics`. JSON body limit 10mb. CORS from `CORS_ORIGIN` (comma-separated).

## Grafana Cloud (OpenTelemetry)

When `OTEL_EXPORTER_OTLP_ENDPOINT` (+ `OTEL_EXPORTER_OTLP_HEADERS`) is set, `src/instrumentation.ts` exports traces/metrics to Grafana Cloud OTLP. Loaded via `--import` before the app (`npm run dev` / `npm start`). See `.env.example`.

## Study AI

- Threads: `ChatThread` / `ChatMessage` in Postgres.
- Reader Ask AI (`POST /api/study/ask`, `/ask/stream`) answers come from the page-ask pipeline but are **saved as a thread** when the body sets `persist: true`: `services/chatThreads.ts` reuses (or creates) one `PAGE`-scoped thread per page, appends the question + answer, and the response / `done` event returns `threadId`. Saving never fails the answer. Failed streams persist an error stub so the thread is not deleted. `GET /chats?pageId=` returns that thread so the reader panel can restore it.
- Retrieval: `services/rag.ts` — vector store (`VECTOR_DB_PROVIDER`: `qdrant` + `VECTOR_DB_URL`, or `pgvector` + Neon `DATABASE_URL`) plus OpenAI-compatible embeddings (`EMBEDDING_MODEL`). Keyword fallback if vector DB is unset.
- Indexing: `services/libraryIndex.ts` + `libraryIndexText.ts` — every published page type (PDF, HTML/MD/TXT/DOCX, sketch/doc notebooks, YouTube videos, links) gets vector chunks. Corpus = catalog metadata + `content.html` / notes + highlights. If HTML is missing/thin, `libraryIndexPdf.ts` Range-GETs `source.pdf` (≤1MB per range, never a full GetObject) and reads pdf.js **one PDF page at a time**. A process-wide lock means Ask and the worker never open two PDFs at once. Text pages are indexed as-is. Scanned pages are JPEG-OCR’d **one page at a time** (max 6, index worker only — Ask does not OCR). OCR HTML is saved as `content.html` with `meta name="shelf-ocr"`. Files over **24MB** are skipped because pdf.js still allocates a buffer of the file length (512MB hosts). Content hash prefix `v5:`. `scheduleIndexPage` after page create/update, highlight create/update/delete, PDF replace, and the processing callback; `purgePageVectors` on page delete.
- Background worker: `services/vectorIndexWorker.ts` polls for never-indexed, pre-`v5:` hash, or stale pages when vectors are configured (`VECTOR_INDEX_WORKER=false` to disable). First tick is delayed (`VECTOR_INDEX_START_DELAY_MS`, default 2 min) so HTTP/auth comes up first. A page is leased (`v5:lease:`) before embed so an OOM does not immediately retry the same file. One-shot backfill: `npm run vector:reindex -- 50`.
- Per-user vector quotas: `utils/quotas.ts` (`FREE_VECTOR_CHUNKS`, `PREMIUM_VECTOR_CHUNKS`, `MAX_CHUNKS_PER_PAGE`). Tracked in `User.vectorChunksUsed` + `PageVectorIndex` (LRU eviction of oldest indexed pages when over quota).
- Prompts: `services/goalPrompt.ts` + `goalTuning.ts` using `User.studyGoal`. Each track (UPSC, State PCS, Judiciary, CA, NEET PG, GATE) is tuned to official syllabus headings, standard material, and PYQ-style practice without inventing paper years. Answers must be structured Markdown; substantial replies can offer a one-line Try next. Library chat and reader Ask may call tools (`library_search`, `lookup_page`, `list_library`, `lookup_collection`, `lookup_recent_pages`, `lookup_starred`, `lookup_highlights`, `lookup_relevancy`, `lookup_planner`, `current_time`, `web_search`, `fetch_url`, plus write tools `create_planner_item`, `update_planner_item`, `create_quiz`) when excerpts are thin or the learner asks for app actions. General (non-document) questions are answered helpfully; document-only modes (summarize / notes / mindmap) stay grounded on the open file.
- Default chat: **`gemini-flash-lite-latest`** (Quick). Standard + Deep: Premium only → **`gemini-flash-latest`**. Free Shelf users → **`LLM_API_KEY_FREE`** only; Premium → paid key (`LLM_API_KEY`) with optional free fallback on credit exhaustion. See `services/apiKeyRoute.ts`, `services/apiKeyPool.ts`.
- On 404 / retired model, auto-retries fallbacks (`LLM_MODEL_FALLBACKS`) and caches the working model in-process. Pacing: `GEMINI_CHAT_RPM` + 4s 429 backoff.
- Embeddings default: **`gemini-embedding-001`** (native `batchEmbedContents`). Set `EMBEDDING_MODEL=gemini-embedding-002` when your key supports it; 404 falls back to 001. Reindex after switching models. Pacing: `GEMINI_EMBED_RPM` (100), batch 8, 1s pause on paid tier.
- Chat memory: free **30** / premium **300** messages per thread (`FREE_CHAT_MESSAGES` / `PREMIUM_CHAT_MESSAGES`); oldest trimmed. Individual messages can be deleted (`DELETE /api/study/chats/:id/messages/:messageId`); a user turn also drops the following assistant reply. Cursor-style edit truncates from a user message onward (`POST …/messages/truncate` with `messageId` or `keepCount`) then the client resubmits. Stop aborts the LLM stream and persists a partial answer.
- Answers return `citations[]` (collection/topic/title/href).
- Retrieval: hybrid Qdrant (top-24, score floor) + keyword RRF blend, diversified across pages → packed excerpts. Query rewrite for short follow-ups. Gemini embeddings use RETRIEVAL_QUERY vs RETRIEVAL_DOCUMENT task types when indexing/searching. Page-ask with no highlight lists that PDF's chunks (spread across the file) and, for scanned pages, the client attaches the visible page JPEG.
- Per-thread **library scope** (`ChatThread.contextKind`: LIBRARY | NOTEBOOK | TOPIC | PAGE) filters RAG to those pages.
- Saved **relevancy / syllabus docs** (`StudyRelevancyDoc`): paste or PDF/txt upload; free **10** / premium **50**; optional `ChatThread.relevancyDocId` injects into the system prompt (unset = general).

## Quiz

- `Quiz` / `QuizQuestion` in Postgres. Sources: `LIBRARY` (collection/topic/page), `UPLOAD` (file or paste), `EXAM_BANK` (PYQ titles in the library + preloaded curriculum + goal syllabus).
- Generate with `services/quiz/` (goal-tuned paper setter, JSON questions). MCQ keys hidden until submit. Written/image answers graded with the chat/vision model. Uses the same LLM token quota as Study AI. `proctored` (default true) is chosen at create; tab/fullscreen violations submit with `endedReason`.

## Domain model (personal library)

Prisma: `backend/prisma/schema.prisma`.

- **UserSubject** = collection (`slug`, name). Nested **topic groups** and **pages**.
- Pages (`UserTopic`) may omit collection and/or topic: library-root (`both null`), collection-level (`subject set, topic null`), or under a topic (`both set`). `contentType` includes `VIDEO` for YouTube lectures (`sourceUrl` + notes HTML). Slug uniqueness is scope-aware (partial indexes). Reserved collection/topic slug: `file`.
- Reading position (`viewPdfPage`, `viewPageOffset`, `viewScrollTop`, `viewScale`, `viewedAt`) lives on the page. `PATCH /pages/:id/progress` accepts `{ view }`; `GET /last-read` returns the latest documents per collection for cross-device resume.
- Do **not** auto-create a default “General” topic.
- Page slugs must stay unique within their scope (`uniquePageSlug` / `pageScope` helpers in my-content routes).
- Files in S3; HTML notes still load through the API. PDF bytes go browser → S3 via presigned GET. Quotas: `utils/quotas.ts`. Root/collection keys use `_file` segment (`userDocPrefix`).

Curriculum **Subject → Topic → Article** is separate from collections.

## Planner items (`StudyTask`)

`kind`: `TASK` | `EVENT`.

- Shared: `title`, `dueAt` (optional — null means unscheduled / To plan), `endsAt`, `notes`, `completed`, `href`.
- **TASK**: `href` is an in-app library path (`/my-content/...`). No recurrence.
- **EVENT**: `href` is an optional **external** URL. `recurrence` = `NONE` | `DAILY` | `WEEKLY` | `MONTHLY`, optional `recurUntil`. No collection/article linkage.
- `GET /api/tasks?from&to` **expands** recurring events into occurrences in range (`utils/recurrence.ts`). Occurrence ids look like `{uuid}::{yyyy-mm-dd}`. PATCH/DELETE must use `masterId()` (strip suffix). Ranged lists also return unscheduled items (`dueAt` null) and overdue incomplete tasks (before `from`) for the planner backlog.
- New columns: migration `prisma/migrations/20260101000012_event_recurrence/`. After pull: `npx prisma migrate dev` (or `migrate deploy`).

## Conventions

- ESM imports with `.js` suffix in TS source (`from "./foo.js"`).
- `param(req, "id")` for route params. Structured logs via `utils/logger.ts`.
- Vitest next to utils (`*.test.ts`). Lint: `eslint src --max-warnings=0`.
- Do not put secrets in the repo. Env: `backend/.env.example`.
