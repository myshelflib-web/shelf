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
Learn /learn/current-affairs          — live feed + SEO share pages
Learn /learn/current-affairs/:slug   — cite, share, iframe embed
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

# Link health — periodic HEAD/embed checks on published source URLs
INGEST_LINK_CHECK=true
INGEST_LINK_CHECK_INTERVAL_MS=21600000
INGEST_LINK_CHECK_STALE_MS=86400000
INGEST_LINK_CHECK_BATCH=30

INTERNAL_SECRET=same-as-ingestion-service
# Also required: DATABASE_URL, S3_*, CORS_ORIGIN, NEXT_PUBLIC_* on frontend
```

### Ingestion worker (`ingestion-service/.env`) — **production checklist**

Set **all** of these on Render (`shelf-ingestion`):

```env
PORT=4002
BACKEND_URL=https://your-api.onrender.com
INTERNAL_SECRET=same-as-backend
INGEST_WORKER_MODE=sqs
LOG_LEVEL=info
SERVICE_NAME=ingestion-service

AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

INGEST_SQS_POLL_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/ACCOUNT/shelf-ingest-poll
INGEST_SQS_FETCH_QUEUE_URL=...
INGEST_SQS_PROCESS_QUEUE_URL=...
INGEST_SQS_PROMOTE_QUEUE_URL=...
INGEST_SQS_ARCHIVE_QUEUE_URL=...

INGEST_SQS_WAIT_SECONDS=20
INGEST_SQS_VISIBILITY_TIMEOUT=300
```

**Must match backend exactly:** `INTERNAL_SECRET`, all five `INGEST_SQS_*` URLs, `AWS_*` creds.

**Frontend (Vercel / Render):**

```env
NEXT_PUBLIC_API_URL=https://your-api.onrender.com
NEXT_PUBLIC_SITE_URL=https://your-app-domain.com
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
| `OFFICIAL_DOCUMENT` | Link/embed in Learn; mirror to admin S3 when embed blocked; PDF copied to **user** library on save | Yes — official PDFs when mirrored or user saves |

Newspaper full-text scraping is **not implemented**.

## Admin setup

1. Deploy migration: `npm run db:deploy --prefix backend`
2. Open **Admin → Ingestion → Seed default sources**
3. Start `ingestion-service` with SQS creds
4. Enable `INGEST_SCHEDULER=true` on backend (or click **Poll now** per source)
5. Review **Pending review** items; approve official docs before promote

## Public pages & SEO

Each published ingest item gets a stable slug and public URL:

- Feed: `/learn/current-affairs?goal=UPSC`
- Item: `/learn/current-affairs/{slug}` — Shelf summary, **copy citation**, **share link**, iframe when the source allows embedding
- JSON-LD `NewsArticle` for search indexing

Broken or non-embeddable sources show a fallback message; link status is rechecked on a schedule.

## Link health

When `INGEST_LINK_CHECK=true` on the **backend**, a scheduler probes published item URLs (HTTP status + `X-Frame-Options` / CSP). Results stored on `IngestItem`: `linkStatus`, `embeddable`, `lastHttpStatus`, `lastLinkCheckAt`.

Admin → **Check link** on any item, or wait for the batch job.

## Ingestion service logging

Structured JSON logs to stdout (Render logs). Key events:

| Event | Meaning |
|---|---|
| `ingest.config.summary` | Startup env sanity check |
| `ingest.sqs.received` | Message pulled from queue |
| `ingest.sqs.ok` / `ingest.sqs.fail` | Job outcome |
| `ingest.api.ok` / `ingest.api.fail` | Backend internal API call |
| `ingest.sqs.loop_error` | AWS/SQS misconfiguration |

Set `LOG_LEVEL=debug` on ingestion-service for per-request detail. Health: `GET /health` on port 4002.

## Phases

1. **Poll** — RSS (PIB, PRS) or official page PDF link detection
2. **Fetch** — Resolve canonical URL + metadata (no admin S3 storage for new ingest)
3. **Process** — Auto-approve gov press; route others to admin review
4. **Promote** — Create Learn `Article` with `sourceUrl` iframe embed (legacy admin PDF uploads still use S3)
5. **Archive** — Supersede older yearly editions (`ARCHIVED` articles, `SUPERSEDED` ingest rows)

Preloaded Learn articles with a `sourceUrl` open in an iframe. Catalog seeding stores **links only** — no `admin/` PDF or summary HTML in S3. **Save to library** downloads a copy into the user's library only when allowed by license; vector indexing runs on user library pages only.

### Preloaded link health

Enable on the backend:

```bash
PRELOADED_LINK_CHECK=true
PRELOADED_LINK_CHECK_INTERVAL_MS=43200000   # 12h between batch ticks
PRELOADED_LINK_CHECK_STALE_MS=604800000     # re-check each article every 7 days
PRELOADED_LINK_CHECK_BATCH=20               # max articles per tick
```

Optional LLM repair when HTTP check returns `BROKEN` (strict caps — not billed to users):

```bash
PRELOADED_URL_REPAIR=true
PRELOADED_URL_REPAIR_MAX_PER_DAY=3
PRELOADED_URL_REPAIR_COOLDOWN_MS=2592000000  # 30 days per article
```

Admin actions: **Seed preloaded catalog**, **Clear S3 pointers** (nulls `pdfKey`/`contentUrl` on link-backed articles), **Check preloaded links**.

### Removing old admin S3 preloaded files

After **Seed preloaded catalog** and **Clear S3 pointers**, verify Learn still opens via iframe. You can then delete objects under the `admin/` prefix in your docs bucket **if** no legacy admin-uploaded PDFs remain (`Article.pdfKey` still set). User uploads live under `users/` — do not delete those.

## Default sources

Seeded from `backend/src/services/ingest/sourceRegistry.ts`: PIB, PRS, UPSC examinations, India Budget, ICAI, GATE, NCERT portal.
