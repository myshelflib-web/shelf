# Agent context — ingestion service

Copyright-safe content ingestion worker for Shelf Learn. Consumes **five SQS queues** (poll → fetch → process → promote → archive) and calls backend `/api/internal/ingest/*`.

## Queues

| Env | Phase |
|---|---|
| `INGEST_SQS_POLL_QUEUE_URL` | Poll RSS / official pages |
| `INGEST_SQS_FETCH_QUEUE_URL` | Download official PDFs |
| `INGEST_SQS_PROCESS_QUEUE_URL` | Review routing + auto-approve gov press |
| `INGEST_SQS_PROMOTE_QUEUE_URL` | Create Learn articles |
| `INGEST_SQS_ARCHIVE_QUEUE_URL` | Supersede old yearly editions |

Set `INGEST_WORKER_MODE=poll` for local dev without SQS (polls `GET /api/internal/ingest/due-sources`).

## Copyright

Never stores full third-party newspaper text. Gov RSS: excerpt + Shelf summary + link. Official PDFs: download only when `OFFICIAL_DOCUMENT` license.

Health: `GET /health` (port **4002** default). Metrics snapshot: `GET /metrics`.

OpenTelemetry: when `OTEL_EXPORTER_OTLP_ENDPOINT` is set, `src/instrumentation.ts` exports traces, metrics, and logs via OTLP (`npm run dev` / `npm start`). Use `OTEL_SERVICE_NAME=shelf-ingestion-service` in Grafana. Local: `docker compose --profile observability up -d`.

## Deploy

Docker image: `YOUR_DOCKERHUB_USER/shelf:ingest-main` (built by CI). Render deploy hook secret: `RENDER_DEPLOY_HOOK_INGESTION`. See [`docs/DOCKER.md`](../docs/DOCKER.md) and [`docs/INGEST.md`](../docs/INGEST.md).
