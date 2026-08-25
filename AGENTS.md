# Agent context — Shelf

This is a **monorepo**. The product is **Shelf**: a personal study library (collections, PDFs, highlights, planner, Study AI).

Read the package `AGENTS.md` for the area you are changing:

| Package | Path | Role |
|---|---|---|
| Frontend | [`frontend/AGENTS.md`](frontend/AGENTS.md) | Next.js 15 App Router UI |
| Backend | [`backend/AGENTS.md`](backend/AGENTS.md) | Express API + Prisma + Postgres |
| Processing service | [`processing-service/AGENTS.md`](processing-service/AGENTS.md) | Async PDF → HTML worker |

Deploy notes: [`docs/DEPLOY.md`](docs/DEPLOY.md), [`docs/DOCKER.md`](docs/DOCKER.md).

## Layout

```
frontend/          Next.js (port 3000)
backend/           Express (port 4000)
processing-service/ Worker + health server (port 4001)
docs/              Human deploy docs
```

Local stack: `docker compose up -d` (Postgres + MinIO + Qdrant). Optional local LLM: `docker compose --profile ai up -d` (Ollama on `:11434`). Node **22** (`.nvmrc`).

## Non-negotiables

- Do **not** commit unless the user asks. Do **not** skip git hooks (`--no-verify`).
- **Do not break existing behavior.** New changes must preserve unrelated APIs, flows, shortcuts, persistence, and UX unless the task explicitly changes them. Prefer the smallest focused diff; no drive-by refactors. See `.cursor/rules/preserve-existing-behavior.mdc`.
- **No source file over 500 lines.** Create or extract modules instead of growing past the cap; when touching an already-oversized file for non-trivial work, shrink it via extraction before adding more. Splits must **not break existing functionality** (move-only; same APIs/behavior). See `.cursor/rules/file-size-limit.mdc`.
- Root `npm run check` = lint + typecheck + tests in **all three** packages. Frontend lint is `next lint --max-warnings=0` — warnings fail pre-push.
- Do not invent a default “General” topic when creating collections.
- User library at `/my-content` is the **signed-in home** (logo + `/` redirect). Collections and **root-level pages** sit side by side; inside a collection, topics and **collection-level pages** sit side by side; full path remains Collection → Topic → Page. Readers: `/my-content/file/[page]`, `/my-content/[notebook]/file/[page]`, `/my-content/[notebook]/[topic]/[page]` (workspace: tabs, optional split, collapsible panels). Curriculum `/learn/...` is separate (admin subjects).
- Keep diffs focused. Match existing visual language (dark theme tokens in `frontend/src/app/globals.css`).
- **Non-blocking UI:** API/network calls must run in the background unless a wait is strictly required (login submit, uncached document bytes, user-initiated AI stream). Hydrate from cache, paint the shell, optimistic mutations. See `.cursor/rules/non-blocking-ui.mdc`.

## Data flow (upload)

1. Client asks the API for a short-lived S3 PUT URL (`POST /api/my-content/uploads/init`, JWT required).
2. Browser uploads the file **directly to S3/MinIO/R2** (progress is the PUT). Then `POST …/uploads/complete` creates the page.
3. PDF lands in S3 as one `source.pdf` per page (`users/{userId}/...` or `admin/...`) — not per-page image/PDF splits.
4. Processor polls / receives `/process`, writes `content.html` beside the PDF, marks page published (search/AI text path).
5. Readers: API mints a short-lived S3 GET URL (`GET /api/my-content/pages/:id/pdf-url`); the browser Range-fetches the PDF from S3/R2. Reopen uses a frontend IndexedDB byte cache (see `frontend/AGENTS.md`).
6. Backend indexes page chunks into the vector DB (when `VECTOR_DB_URL` is set).

## Auth

JWT in `localStorage` key `token`. Backend `Authorization: Bearer`. Google OAuth supported.
