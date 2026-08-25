# Agent context — backend

Express + TypeScript (`"type": "module"`), Prisma 6, PostgreSQL. Entry: `src/index.ts` (default port **4000**). Auth middleware on user routes; JWT `req.user.userId`.

## Route map

| Prefix | File | Notes |
|---|---|---|
| `/api/auth` | `routes/auth.ts` | Register, login, Google, `PATCH /me`, `DELETE /me` |
| `/api/my-content` | `routes/myContent.ts` | Collections, topics, pages, uploads, highlights, clips; library files use `POST /uploads/init` (presigned S3 PUT) then `POST /uploads/complete`; PDF reads use `GET …/pages/:id/pdf-url` (presigned S3 GET, browser Range); `GET/HEAD …/pages/:id/pdf` remains as a fallback stream; `GET /last-read` + `PATCH …/pages/:id/progress` `{ view }` sync reading position across devices |
| `/api/study` | `routes/study.ts`, `routes/studyChats.ts` | Page Ask + `library-ask` RAG; chat threads |
| `/api/tasks` | `routes/tasks.ts` | Tasks **and** events |
| `/api/subjects` | `routes/subjects.ts` | Curriculum (admin catalog); PDF reads use `GET …/articles/:slug/pdf-url` (presigned S3 GET); `GET/HEAD …/pdf` remains as a fallback stream |
| `/api/admin` | `routes/admin.ts` | Admin PDF upload / catalog |
| `/api/highlights` | `routes/highlights.ts` | Curriculum article highlights |
| `/api/progress` | `routes/progress.ts` | Curriculum progress |
| `/api/subscription` | `routes/subscription.ts` | Plans / paywall |
| `/api/internal` | `routes/internal.ts` | Processor callbacks (shared secret) |

Health: `GET /health`, `GET /metrics`. JSON body limit 10mb. CORS from `CORS_ORIGIN` (comma-separated).

## Grafana Cloud (OpenTelemetry)

When `OTEL_EXPORTER_OTLP_ENDPOINT` (+ `OTEL_EXPORTER_OTLP_HEADERS`) is set, `src/instrumentation.ts` exports traces/metrics to Grafana Cloud OTLP. Loaded via `--import` before the app (`npm run dev` / `npm start`). See `.env.example`.

## Study AI

- Threads: `ChatThread` / `ChatMessage` in Postgres.
- Reader Ask AI (`POST /api/study/ask`, `/ask/stream`) answers come from the page-ask pipeline but are **saved as a thread** when the body sets `persist: true`: `services/chatThreads.ts` reuses (or creates) one `PAGE`-scoped thread per page, appends the question + answer, and the response / `done` event returns `threadId`. Saving never fails the answer. `GET /chats?pageId=` returns that thread so the reader panel can restore it.
- Retrieval: `services/rag.ts` — vector store (`VECTOR_DB_PROVIDER`: `qdrant` + `VECTOR_DB_URL`, or `pgvector` + Neon `DATABASE_URL`) plus OpenAI-compatible embeddings (`EMBEDDING_MODEL`). Keyword fallback if vector DB is unset.
- Indexing: `services/libraryIndex.ts` — `scheduleIndexPage` after page create/update and after the processing service callback; `purgePageVectors` on page delete.
- Background worker: `services/vectorIndexWorker.ts` polls for stale/unindexed pages when vectors are configured (`VECTOR_INDEX_WORKER=false` to disable). One-shot backfill: `npm run vector:reindex -- 50`.
- Per-user vector quotas: `utils/quotas.ts` (`FREE_VECTOR_CHUNKS`, `PREMIUM_VECTOR_CHUNKS`, `MAX_CHUNKS_PER_PAGE`). Tracked in `User.vectorChunksUsed` + `PageVectorIndex` (LRU eviction of oldest indexed pages when over quota).
- Prompts: `services/goalPrompt.ts` using `User.studyGoal`; answers must be structured Markdown (headings, lists, tables when comparing).
- Default chat model: **`gemini-flash-latest`** (Google rolling alias). On 404 / retired model, auto-retries fallbacks (`LLM_MODEL_FALLBACKS`) and caches the working model in-process.
- Chat memory: free **30** / premium **300** messages per thread (`FREE_CHAT_MESSAGES` / `PREMIUM_CHAT_MESSAGES`); oldest trimmed.
- Answers return `citations[]` (collection/topic/title/href).
- Retrieval: hybrid Qdrant (top-16, score floor) + keyword blend → up to 8 excerpts.
- Per-thread **library scope** (`ChatThread.contextKind`: LIBRARY | NOTEBOOK | TOPIC | PAGE) filters RAG to those pages.
- Saved **relevancy / syllabus docs** (`StudyRelevancyDoc`): paste or PDF/txt upload; free **10** / premium **50**; optional `ChatThread.relevancyDocId` injects into the system prompt (unset = general).

## Domain model (personal library)

Prisma: `backend/prisma/schema.prisma`.

- **UserSubject** = collection (`slug`, name). Nested **topic groups** and **pages**.
- Pages (`UserTopic`) may omit collection and/or topic: library-root (`both null`), collection-level (`subject set, topic null`), or under a topic (`both set`). Slug uniqueness is scope-aware (partial indexes). Reserved collection/topic slug: `file`.
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
