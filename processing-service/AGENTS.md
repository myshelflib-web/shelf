# Agent context — processing service

Async worker that turns uploaded PDFs into HTML for Shelf. Express health server default port **4001**; processing is **not** the public app API.

## Runtime

- `src/index.ts` — `/health`, `/metrics`, `POST /process` (kick a job).
- `src/worker.ts` — `startWorker()` polls pending jobs (~15s), `runJob()` extracts text/layout and writes HTML. Polls do **not** overlap: **one PDF at a time**. Downloads abort over 24MB. Empty pdf.js extracts do **not** PutObject a 0-byte `content.html`. Scanned PDFs abort after 6 empty pages. `pdfExtract.ts` sets pdf.js verbosity 0, `page.cleanup()`, and `doc.destroy()`.

Env aligns with backend S3 + database (see `.env.example`). Internal calls from backend use a shared secret (`/api/internal` on the API).

OpenTelemetry: when `OTEL_EXPORTER_OTLP_ENDPOINT` is set, `src/instrumentation.ts` exports traces, metrics, and logs via OTLP (`npm run dev` / `npm start`). Local Grafana: `docker compose --profile observability up -d`.

## Object layout

Keep PDF and HTML **in the same folder**:

- Admin: `admin/{subject}/{topic}/source.pdf` + `content.html`
- User: `users/{userId}/{notebook}/{page}/source.pdf` + `content.html`

Status on the page/article moves `PROCESSING` → `PUBLISHED` (or failed). If the worker is down, uploads stay unreadable.

## Conventions

- ESM + TypeScript, Vitest beside source, `eslint src --max-warnings=0`.
- Don’t block the event loop with huge sync PDF work if a queued/job pattern already exists — follow `worker.ts`.
- Local S3 is MinIO from root `docker compose`. Node 22.

## When changing this package

Preserve the contract backend already uses: job payload fields (`topicId` / `userId` / `pdfKey` / slugs), HTML output path, and status updates. Coordinate schema changes with `backend/prisma`.
