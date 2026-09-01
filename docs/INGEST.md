# Content ingestion pipeline

Copyright-safe ingestion for **current affairs** and **official syllabus/brochure** updates. Uses five **Amazon SQS** queues and the `ingestion-service` worker.

## Architecture

```
Backend scheduler (INGEST_SCHEDULER=true)
    → SQS poll queue
ingestion-service (INGEST_WORKER_MODE=sqs)
    → poll → fetch → process → promote → archive queues
    → POST /api/internal/ingest/*
Postgres IngestSource / IngestItem / IngestJob
Public GET /api/current-affairs?goal=UPSC
Admin /admin/ingest
Learn /learn/current-affairs
```

## SQS queues to create

Create **five standard queues** (or FIFO with `.fifo` suffix — publisher detects FIFO URLs):

| Queue name (suggested) | Env var |
|---|---|
| `shelf-ingest-poll` | `INGEST_SQS_POLL_QUEUE_URL` |
| `shelf-ingest-fetch` | `INGEST_SQS_FETCH_QUEUE_URL` |
| `shelf-ingest-process` | `INGEST_SQS_PROCESS_QUEUE_URL` |
| `shelf-ingest-promote` | `INGEST_SQS_PROMOTE_QUEUE_URL` |
| `shelf-ingest-archive` | `INGEST_SQS_ARCHIVE_QUEUE_URL` |

Recommended settings:

- Visibility timeout: **300** seconds (`INGEST_SQS_VISIBILITY_TIMEOUT`)
- Long poll wait: **20** seconds (`INGEST_SQS_WAIT_SECONDS`)
- Dead-letter queue after 5 receives (optional but recommended)

## Environment

### Backend (`backend/.env`)

```env
INGEST_SCHEDULER=true
INGEST_SCHEDULER_INTERVAL_MS=300000

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

INGEST_SQS_POLL_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT/shelf-ingest-poll
INGEST_SQS_FETCH_QUEUE_URL=...
INGEST_SQS_PROCESS_QUEUE_URL=...
INGEST_SQS_PROMOTE_QUEUE_URL=...
INGEST_SQS_ARCHIVE_QUEUE_URL=...
```

### Ingestion worker (`ingestion-service/.env`)

```env
BACKEND_URL=https://your-api.onrender.com
INTERNAL_SECRET=same-as-backend
INGEST_WORKER_MODE=sqs
# same AWS + queue URLs as backend
PORT=4002
```

### Local dev without SQS

```env
INGEST_WORKER_MODE=poll
INGEST_POLL_INTERVAL_MS=60000
```

Run `ingestion-service` — it polls `GET /api/internal/ingest/due-sources` and calls poll directly.

## Render deploy (production)

1. Create Render web service → **Deploy existing image** → `docker.io/YOUR_USER/shelf:ingest-main`
2. Set env from `ingestion-service/.env.example` (SQS URLs, AWS creds, `BACKEND_URL`, `INTERNAL_SECRET`)
3. Copy Render **Deploy Hook** → GitHub secret `RENDER_DEPLOY_HOOK_INGESTION`
4. On backend Render service: `INGEST_SCHEDULER=true` + same SQS queue URLs

CI builds and pushes `:ingest-main` when `ingestion-service/**` changes on `main`. See [`DOCKER.md`](DOCKER.md).

## Copyright policy

| License | Stored in Shelf | Full text |
|---|---|---|
| `GOVERNMENT_PRESS` | Title, link, ≤280 char RSS excerpt, Shelf summary | No — link out |
| `LINK_ONLY` | Title, link, Shelf summary only | No |
| `OFFICIAL_DOCUMENT` | PDF in S3 when approved | Yes — official PDFs only |

Newspaper full-text scraping is **not implemented**.

## Admin setup

1. Deploy migration: `npm run db:deploy --prefix backend`
2. Open **Admin → Ingestion → Seed default sources**
3. Start `ingestion-service` with SQS creds
4. Enable `INGEST_SCHEDULER=true` on backend (or click **Poll now** per source)
5. Review **Pending review** items; approve official docs before promote

## Phases

1. **Poll** — RSS (PIB, PRS) or official page PDF link detection
2. **Fetch** — Download official PDFs to S3 (`OFFICIAL_DOCUMENT` only)
3. **Process** — Auto-approve gov press; route others to admin review
4. **Promote** — Create Learn `Article` (PDF → processing service; links → summary HTML in S3)
5. **Archive** — Supersede older yearly editions (`ARCHIVED` articles, `SUPERSEDED` ingest rows)

## Default sources

Seeded from `backend/src/services/ingest/sourceRegistry.ts`: PIB, PRS, UPSC examinations, India Budget, ICAI, GATE, NCERT portal.
