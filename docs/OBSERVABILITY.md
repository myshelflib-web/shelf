# Observability & Grafana dashboards

Shelf exports **traces**, **metrics**, and **structured logs** over OTLP when `OTEL_EXPORTER_OTLP_ENDPOINT` is set (Grafana Cloud or local `docker compose --profile observability up -d`).

Services:

| Service | `OTEL_SERVICE_NAME` | Port |
|---|---|---|
| Backend | `shelf-backend` | 4000 |
| Processing worker | `shelf-processing-service` | 4001 |
| Ingestion worker | `shelf-ingestion-service` | 4002 |

Also available locally: `GET /metrics` (JSON snapshot) on each service.

---

## Metric catalog

### HTTP availability & latency

| Metric | Labels | Use |
|---|---|---|
| `http_requests_total` | `method`, `status`, `route_group`, `status_class` | Availability, error rate by area |
| `http_request_duration_ms` | same | p50/p95 latency by product area |

`route_group`: `study`, `quiz`, `library`, `auth`, `billing`, `planner`, `internal`, …

**Availability (5xx rate):**
```promql
sum(rate(http_requests_total{status_class="5xx"}[5m]))
/
sum(rate(http_requests_total[5m]))
```

**Study API p95 latency:**
```promql
histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_ms_bucket{route_group="study"}[5m]))
)
```

> If using JSON `/metrics` only, export via OTLP for histogram buckets in Grafana.

---

### LLM usage & cost (chat, quiz, ask, tools)

| Metric | Labels | Use |
|---|---|---|
| `llm_requests_total` | `flow`, `model`, `ok`, `stream`, `route` | Success/error counts |
| `llm_duration_ms` | same | LLM latency |
| `llm_tokens_total` | `flow`, `model`, `kind` (`total`/`prompt`/`completion`) | Token volume |
| `llm_cost_usd_total` | `flow`, `model` | **Estimated** spend (see below) |
| `llm_quota_tokens_total` | `flow` | Tokens billed to user monthly quota |

**Flows:** `study_chat`, `study_ask`, `study_ask_stream`, `study_map_reduce`, `study_tools`, `study_library_ask`, `quiz_generate`, `quiz_grade`, `pdf_ocr`, …

**Tokens by flow (rate):**
```promql
sum by (flow) (rate(llm_tokens_total{kind="total"}[1h]))
```

**Estimated daily AI cost (USD):**
```promql
sum(increase(llm_cost_usd_total[24h]))
+ sum(increase(embedding_cost_usd_total[24h]))
```

Cost uses static per-model rates in `backend/src/utils/llmPricing.ts` — good for trends, not billing. Override rates there when Google/OpenAI pricing changes.

---

### Embeddings & vector search

| Metric | Labels | Use |
|---|---|---|
| `embedding_requests_total` | `task`, `model`, `ok` | Index vs query embed health |
| `embedding_duration_ms` | same | Embed latency |
| `embedding_texts_total` | `task`, `model` | Texts embedded per call |
| `embedding_tokens_estimated_total` | `task`, `model` | Char-based token estimate |
| `embedding_cost_usd_total` | `task`, `model` | Estimated embed spend |
| `vector_search_requests_total` | `ok` | RAG retrieval health |
| `vector_search_duration_ms` | `ok` | Search latency |
| `vector_search_hits_total` | `ok` | Chunks returned |
| `vector_index_pages_total` | `ok` | Background indexer |
| `vector_index_page_duration_ms` | `ok` | Index time per page |
| `vector_index_chunks_total` | `ok` | Chunks written |

**Index backlog proxy:** compare `vector_index_pages_total{ok=true}` rate vs upload rate; cross-check logs `vector_worker.idle` / `pending`.

---

### Product flows

| Metric | Labels | Use |
|---|---|---|
| `product_flows_total` | `domain`, `action`, `ok` | End-to-end study/quiz/billing events |
| `product_flow_duration_ms` | same | User-visible flow latency |

Examples: `study` + `ask`, `study` + `ask_stream`, `study` + `library_ask`.

---

### Infrastructure & reliability

| Metric | Source |
|---|---|
| `fetch_retries_total` | Outbound HTTP retries |
| `db_retries_total` | Prisma transient retries |
| `s3_ops_total`, `s3_op_duration_ms` | Storage |
| `worker_jobs_total`, `worker_job_duration_ms` | PDF processing |
| `razorpay_orders_total` | Checkout |
| `unhandled_errors_total` | Backend crashes |

---

## Suggested Grafana dashboard rows

1. **Overview** — uptime, request rate, 5xx %, p95 latency (all `route_group`)
2. **Study AI** — LLM requests by `flow`, tokens/hr, est. cost/day, stream vs non-stream errors
3. **Quiz** — `quiz_generate` / `quiz_grade` tokens & latency, `product_flows_total{domain="study"}`
4. **Search / index** — embedding rate, vector search p95, index pages/hr, index failures
5. **Infra** — S3 errors, worker job duration, fetch/db retries, Render cold starts (via 502/503 on `http_requests_total`)

---

## Logs & traces

- Query logs: `{service_name="shelf-backend"} | json | msg="llm.ok"`
- Correlate with traces using `traceId` / `x-request-id` response headers
- Flow events: `study.ask.ok`, `quiz.generate.ok`, `billing.checkout.ok`, etc.

---

## Local verification

```bash
# Start observability stack
docker compose --profile observability up -d

# Backend with OTLP
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_SERVICE_NAME=shelf-backend
npm run dev --prefix backend

# Trigger traffic, then:
curl -s localhost:4000/metrics | jq '.sums, .counters | keys'
```

Grafana UI: http://localhost:3001

---

## Frontend errors (PostHog)

The Next.js app reports client issues to **PostHog** when `NEXT_PUBLIC_ANALYTICS_KEY` is set (`frontend/src/lib/analytics/`).

| Event | When |
|---|---|
| `api_request_failed` | Any failed `api.ts` / quiz API call (network or HTTP error) |
| `study_sse` failures | Study AI stream HTTP/network errors (property `source`) |
| `client_error` | Uncaught JS errors |
| `unhandled_rejection` | Unhandled promise rejections (via `client_error` + `kind`) |
| `component_error` | React Error Boundary catch |
| `chunk_load_failed` | Next.js lazy-chunk / dynamic import failures |
| `$exception` | PostHog native exception autocapture (enabled in SDK init) |

Every API failure includes `request_id` — paste into Grafana logs:

```logql
{service_name="shelf-backend"} | json | requestId="<request_id from PostHog>"
```

**PostHog dashboard ideas:**
- Trend: `api_request_failed` by `path` and `status`
- Trend: `component_error` + `chunk_load_failed`
- Session replay: filter users who fired `api_request_failed` in the last hour
- Breakdown: errors by `route` (page URL path)

Existing product failure events still fire: `upload_error`, `study_ai_stream_error`, `quiz_generation_failed`, `pdf_processing_failed`.
