# Production Deployment

Deploy with **Vercel + Neon + Cloudflare R2 + Render**. No credit card required on free tiers. **No CI/CD pipeline needed** — Vercel and Render deploy automatically when you push to GitHub.

---

## Architecture

```
GitHub (push to main)
    │
    ├──► Vercel          → Next.js frontend
    │
    ├──► Render          → Express backend (port 4000)
    │
    └──► Render          → Processing service (polls for jobs)

Neon                   → PostgreSQL
Cloudflare R2          → S3 bucket (admin/ + users/{id}/ folders)
Qdrant Cloud (optional) → Study AI vector index (`VECTOR_DB_URL`)
```

---

## Cost (cheapest — Option 1)

| Service | Cost/month | Card needed? |
|---------|------------|--------------|
| Vercel Hobby | ₹0 | No |
| Neon Free | ₹0 | No |
| Render Free (backend + worker) | ₹0 | No |
| Cloudflare R2 (< 10 GB) | ₹0 | Debit for signup |

**Total: ₹0/month** to start (Render free tier has cold starts after idle).

---

## Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/upsc-learning-platform.git
git push -u origin main
```

---

## Step 2 — Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) (no card)
2. Create project → copy **connection string**
3. Run migrations once from your laptop (or they run automatically on Docker deploy):

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

If the backend crashes with `UserTopic.fileSizeBytes does not exist`, production is behind — run the command above against your **Neon** URL (same value as Render `DATABASE_URL`), then restart the backend.

Optional seed (demo catalog only):

```bash
DATABASE_URL="postgresql://..." npm run db:seed
```

---

## Step 3 — Storage (Cloudflare R2)

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
2. R2 → **Create bucket** → name it `upsc-docs`
3. R2 → **Manage R2 API Tokens** → **Create API token**
   - Permission: **Object Read & Write** (or Admin for that bucket)
   - Scope: apply to bucket `upsc-docs`
4. Copy the **Access Key ID** (32 chars) and **Secret Access Key** (64 chars)
5. Find your **Account ID** in the R2 overview page (used in the endpoint URL)

Set on **both** backend and processing service (Render env vars):

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<Access Key ID from step 4>
S3_SECRET_KEY=<Secret Access Key from step 4>
S3_BUCKET=upsc-docs
S3_REGION=auto
```

**Notes:**
- Use **R2 API tokens**, not your global Cloudflare API key
- R2 buckets are **private** (no public bucket). The API mints short-lived URLs; the browser PUTs uploads and Range-GETs PDFs straight to R2. Page metadata, HTML notes, highlights, and Study AI still go through the API.
- Library uploads go **browser → R2** with a short-lived presigned PUT. The bucket must allow CORS from your **Vercel origin** (the site URL in the browser, not the Render API URL).

### R2 bucket CORS (required for direct uploads)

This is **not** the same as Render `CORS_ORIGIN` (that only lets the browser call the API). Without bucket CORS, `PUT` (upload) and `GET`/`HEAD` (PDF.js Range reads) to the presigned URL fail in the browser.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**.
2. Click your bucket (`upsc-docs`).
3. Open **Settings**.
4. Find **CORS Policy** → **Add CORS policy** (or **Edit**).
5. Paste this, replacing the origin with your real Vercel URL (no trailing slash). If you also use a custom domain, list both:

```json
[
  {
    "AllowedOrigins": [
      "https://your-app.vercel.app",
      "https://www.your-custom-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*", "Range", "Content-Type"],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type",
      "Content-Range",
      "Accept-Ranges"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

6. Save.

Also set Render **backend** `CORS_ORIGIN` to the **same** origin(s), comma-separated if you have two:

```
CORS_ORIGIN=https://your-app.vercel.app,https://www.your-custom-domain.com
```

On boot the backend tries `PutBucketCors` using `CORS_ORIGIN`. That often **fails** with a typical R2 “Object Read & Write” token (no permission to change bucket CORS). The dashboard step above is the reliable one. After saving, retry an upload — a CORS failure looks like “Cannot reach storage” with status 0 in the browser.

To confirm later: DevTools → Network → the `PUT` (upload) and Range `GET` (PDF read) to `r2.cloudflarestorage.com` should be 200, with a prior `OPTIONS` preflight. Those requests must **not** send `Authorization: Bearer`. The API calls are only `…/uploads/init`, `…/uploads/complete`, and `…/pdf-url`.

- Local dev still uses MinIO; production uses R2 — the code auto-detects from the endpoint URL

---

## Step 4 — Backend (Render)

1. Sign up at [render.com](https://render.com) (no card on free tier)
2. **New → Web Service** → connect GitHub repo
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install && npx prisma generate && npm run build`
   - **Start command:** `npm start`
4. Environment variables (from `backend/.env.example`):

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | Random long string |
| `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY` | R2 access key |
| `S3_SECRET_KEY` | R2 secret key |
| `S3_BUCKET` | `upsc-docs` |
| `S3_REGION` | `auto` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `INTERNAL_SECRET` | Same random string as processing service |
| `GOOGLE_CLIENT_ID` | Optional |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional — Grafana Cloud OTLP URL (`…/otlp`) |
| `OTEL_EXPORTER_OTLP_HEADERS` | Optional — `Authorization=Basic%20…` from Grafana wizard |
| `OTEL_SERVICE_NAME` | Optional — `shelf-backend` |
| `OTEL_DEPLOYMENT_ENVIRONMENT` | Optional — `production` |

### Keep free tier awake (temporary)

Render free web services spin down after ~**15 minutes** idle. Until you upgrade, a light `GET /health` every **10 minutes** keeps the API warm.

1. GitHub repo → **Settings → Variables** → add `RENDER_BACKEND_URL` = `https://your-api.onrender.com` (or reuse existing `NEXT_PUBLIC_API_URL`).
2. Optional: `RENDER_PROCESSOR_URL` for the processing service.
3. Workflow: [`.github/workflows/keep-render-awake.yml`](../.github/workflows/keep-render-awake.yml) (runs on a schedule; **Actions → Keep Render awake → Run workflow** to test).
4. Local alternative: `BACKEND_URL=https://your-api.onrender.com ./scripts/keep-render-awake.sh`

Disable or delete that workflow once the backend is on a paid always-on plan.

### Study AI + Qdrant (optional but required together)

**Qdrant only stores vectors.** Chat and embeddings need OpenAI-compatible APIs.

**Groq free tier** = chat only (no embeddings). Use Groq for `LLM_*` and a separate free embedding provider for `EMBEDDING_*`.

**Recommended free stack:** Groq chat + **Jina** embeddings + Qdrant.

| Variable | Groq + Jina (recommended) |
|----------|---------------------------|
| `VECTOR_DB_URL` | Qdrant Cloud REST URL |
| `VECTOR_DB_API_KEY` | Qdrant API key |
| `VECTOR_DB_COLLECTION` | `shelf-library` |
| `LLM_API_KEY` | Groq key (`gsk_...`) |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | `llama-3.1-8b-instant` |
| `EMBEDDING_API_KEY` | Free key from [jina.ai/?sui=apikey](https://jina.ai/?sui=apikey) |
| `EMBEDDING_BASE_URL` | `https://api.jina.ai/v1` |
| `EMBEDDING_MODEL` | `jina-embeddings-v3` |

**Gemini Flash-Lite (chat) + gemini-embedding-001** — set all of these. Prefer Google’s rolling lite alias:

| Variable | Gemini |
|----------|--------|
| `LLM_API_KEY` | Google AI Studio key (`AIza…`) |
| `LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `LLM_MODEL` | `gemini-flash-lite-latest` (default) or `gemini-flash-latest` |
| `EMBEDDING_API_KEY` | Same AI Studio key (or a dedicated one) |
| `EMBEDDING_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| `EMBEDDING_MODEL` | `gemini-embedding-001` |
| `GEMINI_CHAT_RPM` | `15` free-tier Flash-Lite (raise if billed) |
| `GEMINI_EMBED_RPM` | `100` free-tier embedding-001 |

Optional Google web lookup (Custom Search JSON API — does not burn Gemini RPM). Create a Programmable Search Engine and enable Custom Search API:

| Variable | Google web search |
|----------|-------------------|
| `GOOGLE_CSE_ID` | Search engine `cx` |
| `GOOGLE_SEARCH_API_KEY` | API key with Custom Search API enabled |

If CSE is unset, Study AI falls back to Gemini Google Search grounding (uses Flash-Lite RPM), then Wikipedia / DuckDuckGo.

If a model returns 404 / “no longer available”, the backend retries `LLM_MODEL_FALLBACKS` and remembers the working model until restart.

**Free-tier speed tips (Render):** stay on lite, keep `PAGE_ASK_CONTEXT_BUDGET` ≤ 6500 (default), leave embedding batch at 4 / 2s pause, avoid `PAGE_ASK_ALWAYS_VECTORS=true` unless you need retrieval on every ask. Render free cold starts add 30–60s after idle — unrelated to Gemini.

**“Study AI failed” with no backend logs:** the browser usually got a non-JSON error (404/502 HTML) before Express handled the request — often Vercel frontend ahead of a Render redeploy for `/api/study/ask/stream`, or a cold-start gateway timeout. Rate limits *do* log (`llm.request.failed` / `study.ask.*`) and return a clear “rate limit” / “quota” message. Check the **backend** Render service logs (not the processing worker) for `study.ask.stream.start` / `study.ask.start`.

If `VECTOR_DB_URL` is set but embeddings fail (`model_not_found`), you are likely pointing embeddings at Groq — set `EMBEDDING_*` separately.

Local Ollama (`nomic-embed-text`) is for laptop Docker only — do **not** point production Render at `localhost:11434`.

5. Deploy → note URL: `https://your-api.onrender.com`

---

## Step 5 — Processing service (Render)

1. **New → Web Service** → same GitHub repo
2. Settings:
   - **Root directory:** `processing-service`
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
3. Environment variables (from `processing-service/.env.example`):

| Variable | Value |
|----------|-------|
| `BACKEND_URL` | `https://your-api.onrender.com` |
| `INTERNAL_SECRET` | Same as backend |
| `S3_ENDPOINT` | Same as backend |
| `S3_ACCESS_KEY` | Same as backend |
| `S3_SECRET_KEY` | Same as backend |
| `S3_BUCKET` | `upsc-docs` |
| `POLL_INTERVAL_MS` | `15000` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Same as backend (optional) |
| `OTEL_EXPORTER_OTLP_HEADERS` | Same as backend (optional) |
| `OTEL_SERVICE_NAME` | `shelf-processing-service` |
| `OTEL_DEPLOYMENT_ENVIRONMENT` | `production` |

### Where to paste Grafana / OTEL vars (production)

When set, Shelf exports **traces**, **HTTP + app metrics** (`http_requests_total`, upload counters, etc.), and **structured application logs** to Grafana over OTLP.

Do **not** put them only in local `.env` if you want production telemetry. Add them in the host UI:

1. [Grafana Cloud](https://grafana.com/products/cloud/) → **Connections** → **OpenTelemetry** → copy OTLP endpoint + `Authorization=Basic …` header.
2. Open [dashboard.render.com](https://dashboard.render.com) → your **backend** web service → **Environment** → **Add Environment Variable** (or bulk edit).
3. Add:
   - `OTEL_EXPORTER_OTLP_ENDPOINT` = `https://otlp-gateway-prod-ap-south-1.grafana.net/otlp` (your region)
   - `OTEL_EXPORTER_OTLP_HEADERS` = the `Authorization=Basic%20…` value from Grafana
   - `OTEL_SERVICE_NAME` = `shelf-backend`
   - `OTEL_DEPLOYMENT_ENVIRONMENT` = `production`
4. Repeat on the **processing service** with `OTEL_SERVICE_NAME=shelf-processing-service` (same endpoint + headers).
5. Save → Render redeploys. In Grafana: **Explore** → Loki for logs, **Metrics** for counters/histograms, **Traces** for request spans. No OTEL vars needed on **Vercel** (frontend is not instrumented yet).

**Verify on Render:** after deploy, open backend **Logs** and search for `"msg":"otel.started"`. If missing, the Docker image is not loading `instrumentation.js` (backend/processing Dockerfiles must start Node with `--import ./dist/instrumentation.js`).

**Local dev:** `docker compose --profile observability up -d` → Grafana UI at [http://localhost:3001](http://localhost:3001), OTLP HTTP at `http://localhost:4318` (no auth header). Set `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` in `backend/.env` and `processing-service/.env`.

The worker polls the backend every 15s for PDFs waiting to be processed.

---

## Step 6 — Frontend (Vercel)

1. Sign up at [vercel.com](https://vercel.com) (no card)
2. **Add New Project** → import GitHub repo
3. Settings:
   - **Root directory:** `frontend`
   - **Framework:** Next.js (auto-detected)
4. Environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-api.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional |

5. Deploy → your app is live at `https://your-app.vercel.app`

---

## Deploy flow (no pipeline)

Every `git push` to `main`:

- **Vercel** rebuilds and deploys frontend automatically
- **Render** rebuilds and deploys backend + processing service automatically

No GitHub Actions deploy workflow required.

### Optional: CI on pull requests

`.github/workflows/ci.yml` runs build checks when you open a PR. This is optional quality assurance — not required for deployment.

---

## S3 folder layout

```
upsc-docs/
├── admin/{subject}/{topic}/source.pdf
├── admin/{subject}/{topic}/content.html
└── users/{userId}/{section}/{page}/source.pdf
    users/{userId}/{section}/{page}/content.html
```

---

## Free tier limitations

| Limitation | Workaround |
|------------|------------|
| Render sleeps after 15 min idle | Upgrade to Starter (~$7/mo) or use Oracle Always Free VM |
| Render 750 free hours/month | Combine services or upgrade |
| Neon DB sleeps after 5 min idle | First query may be slow; upgrade if needed |
| Vercel Hobby = personal use only | Upgrade to Pro ($20/mo) for commercial apps |

---

## Alternatives (debit / UPI)

| Option | Cost | Payment |
|--------|------|---------|
| **Oracle Cloud Always Free VM** | ₹0 | Debit verification |
| **Hostinger India VPS** | ₹599–999/mo | UPI / debit |
| **Render Starter** (always-on API) | ~₹595/mo | Debit |

---

## Troubleshooting

**CORS errors** — two different CORS settings:
- Browser → **API**: Render `CORS_ORIGIN` must exactly match the Vercel URL (no trailing slash).
- Browser → **R2** (upload PUT and PDF Range GET): set the same origin on the R2 bucket **Settings → CORS Policy** (see Step 3). A failed PUT/GET shows as “Cannot reach storage”.

**PDFs stuck on PROCESSING** — ensure the processing-service Render service is running and `INTERNAL_SECRET` matches backend.

**Empty topic content** — check R2 bucket has files under `admin/` and env vars are correct.

**Cold start (30–60s)** — Render free tier; first request after idle is slow.

**`embeddings.failed` / Gemini 401 on `AQ.` keys** — switch embeddings to Jina: `EMBEDDING_BASE_URL=https://api.jina.ai/v1`, `EMBEDDING_MODEL=jina-embeddings-v3`, free key from jina.ai. Qdrant does not embed text.
