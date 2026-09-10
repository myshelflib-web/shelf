# Production Deployment

Deploy with **Vercel + Neon + Cloudflare R2 + Render**. Merge to `main` still deploys production. PR previews use an **isolated staging stack** (separate Neon DB + separate R2 bucket). Full staging checklist: [`STAGING.md`](STAGING.md). Full deploy notes: [`DOCKER.md`](DOCKER.md).

---

## Architecture

```
GitHub
  │
  ├── PR (FE only)         → Vercel Preview only
  ├── PR (backend/workers) → CI + automatic shared staging
  └── when you choose      → manual production deploy
        optional           → Actions → Deploy production (manual redeploy)

Neon                   → PostgreSQL (separate DB/branch for staging)
Cloudflare R2          → S3 bucket (admin/ + users/{id}/ folders)
Qdrant Cloud (optional) → Study AI vector index (`VECTOR_DB_URL`)
```

---

## Cost (cheapest — Option 1)

| Service | Cost/month | Card needed? |
|---------|------------|--------------|
| Vercel Hobby | ₹0 | No |
| Neon Free | ₹0 | No |
| Render Free (backend + worker + staging) | ₹0 | No |
| Cloudflare R2 (< 10 GB) | ₹0 | Debit for signup |

**Total: ₹0/month** to start (Render free tier has cold starts after idle). Staging services count toward the free-service limit.

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
2. Create project → copy **connection string** (production)
3. Create a **second** database or Neon branch for **staging**
4. Run migrations against each URL once:

```bash
cd backend
DATABASE_URL="postgresql://...prod..." npx prisma migrate deploy
DATABASE_URL="postgresql://...staging..." npx prisma migrate deploy
```

If the backend crashes with `UserTopic.fileSizeBytes does not exist`, that environment is behind — run migrate deploy against its `DATABASE_URL`, then restart the service.

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

Set on **both** backend and processing service (Render env vars), for prod and staging:

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=<Access Key ID from step 4>
S3_SECRET_KEY=<Secret Access Key from step 4>
S3_BUCKET=upsc-docs
S3_REGION=auto
```

**Notes:**
- Use **R2 API tokens**, not your global Cloudflare API key
- R2 buckets are **private** (no public bucket). The API mints short-lived URLs; the browser PUTs uploads and Range-GETs PDFs straight to R2.
- Library uploads go **browser → R2** with a short-lived presigned PUT. The bucket must allow CORS from your **Vercel origins** (site URL in the browser, not the Render API URL).

### R2 bucket CORS (required for direct uploads)

This is **not** the same as Render `CORS_ORIGIN` (that only lets the browser call the API). Without bucket CORS, `PUT` (upload) and `GET`/`HEAD` (PDF.js Range reads) to the presigned URL fail in the browser.

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**.
2. Click your bucket (`upsc-docs`).
3. Open **Settings** → **CORS Policy** → **Add** / **Edit**.
4. Paste this, replacing origins with your real URLs (no trailing slash). Include production, staging FE, and note the Vercel preview caveat below:

```json
[
  {
    "AllowedOrigins": [
      "https://your-app.vercel.app",
      "https://www.your-custom-domain.com",
      "https://your-staging-alias.vercel.app"
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

R2 may not accept a true `*.vercel.app` wildcard — if PR-preview uploads fail, add the specific preview origin or use `STAGING_FRONTEND_ALIAS` for upload testing.

5. Save.

Also set Render **backend** `CORS_ORIGIN` to the same exact origin(s), comma-separated. On **staging** backend only, set `ALLOW_VERCEL_PREVIEW_CORS=true` so API calls from arbitrary `*.vercel.app` PR previews succeed (API CORS ≠ R2 CORS).

```
CORS_ORIGIN=https://your-app.vercel.app,https://www.your-custom-domain.com
```

On boot the backend tries `PutBucketCors` using `CORS_ORIGIN`. That often **fails** with a typical R2 “Object Read & Write” token. The dashboard step above is the reliable one.

To confirm: DevTools → Network → `PUT` / Range `GET` to `r2.cloudflarestorage.com` should be 200. Those must **not** send `Authorization: Bearer`.

- Local dev still uses MinIO; production uses R2 — the code auto-detects from the endpoint URL

---

## Step 4 — Backend (Render)

Prefer **Deploy an existing image** (see [`DOCKER.md`](DOCKER.md)): create **production** and **staging** web services.

Staging image: `…/shelf:staging`. Production image: `…/shelf:main`.

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Neon connection string (env-specific) |
| `JWT_SECRET` | Random long string |
| `S3_*` | R2 credentials (same as Step 3) |
| `CORS_ORIGIN` | FE origin(s) for that env |
| `ALLOW_VERCEL_PREVIEW_CORS` | `true` on **staging only** |
| `INTERNAL_SECRET` | Same as processing service |
| `OTEL_DEPLOYMENT_ENVIRONMENT` | `staging` or `production` |

Wire Deploy Hooks to the matching GitHub secrets (`*_STAGING` vs prod). See [`DOCKER.md`](DOCKER.md).

### Keep free tier awake (temporary)

Render free web services spin down after ~**15 minutes** idle.

1. GitHub → **Settings → Variables** → `RENDER_BACKEND_URL` = production API origin.
2. Optional: `RENDER_PROCESSOR_URL`.
3. Workflow: [`.github/workflows/keep-render-awake.yml`](../.github/workflows/keep-render-awake.yml).
4. Local: `BACKEND_URL=https://your-api.onrender.com ./scripts/keep-render-awake.sh`

### Study AI + Qdrant (optional)

Set `VECTOR_DB_*`, `LLM_*`, and `EMBEDDING_*` on the backend (see `backend/.env.example`). Prefer separate vector collections for staging vs production if sharing a Qdrant cluster.

**“Study AI failed” with no backend logs:** often FE ahead of a Render redeploy, or a cold-start timeout. Check **backend** Render logs for `study.ask.stream.start`.

Note URLs: prod `https://your-api.onrender.com`, staging `https://your-api-staging.onrender.com`.

---

## Step 5 — Processing + ingestion (Render)

Same image-deploy pattern ([`DOCKER.md`](DOCKER.md), [`INGEST.md`](INGEST.md)). Create staging + production services; point workers’ `BACKEND_URL` at the matching API; attach staging/prod deploy hooks.

---

## Step 6 — Frontend (Vercel)

1. Sign up at [vercel.com](https://vercel.com)
2. **Add New Project** → import GitHub repo
3. Settings: **Root directory** `frontend`, Framework Next.js
4. Environment variables — set **`NEXT_PUBLIC_API_URL` on both** Preview and Production:

| Variable | Preview | Production |
|----------|---------|------------|
| `NEXT_PUBLIC_API_URL` | Staging Render API | **Prod** Render API |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Optional |

Preview alone is not enough: production FE builds read the Production env and must call the prod API.

5. Keep Preview deployments for PRs. Production is deployed manually via **Deploy production**.
6. Optional: GitHub secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for CLI staging/manual tools.

---

## Deploy flow

| Trigger | What deploys |
|---------|----------------|
| Pull request (frontend only) | CI + Vercel Preview — no staging Docker |
| Pull request (backend/workers) | CI + automatic staging Docker/Render update |
| **Actions → Deploy staging** | Optional manual staging redeploy |
| Merge / push to `main` | CI checks + Vercel Production Git deploy only |
| **Actions → Deploy production** | Manual production Docker/Render deploy |

**Shared staging** (when configured): one staging API for PR previews; concurrent backend PRs overwrite it. Missing staging secrets only skip staging hooks.

Details: [`DOCKER.md`](DOCKER.md). Workflows: [ci.yml](../.github/workflows/ci.yml), [deploy-production.yml](../.github/workflows/deploy-production.yml).

---

## S3 folder layout

```
upsc-docs/
├── admin/{subject}/{topic}/source.pdf
├── admin/{subject}/{topic}/content.html
├── users/{userId}/...
```

Admin curriculum and personal library share the bucket; keys are namespaced. Staging may share the same bucket (separate Neon) — prefer a staging bucket if you need hard isolation.

---

## Observability (optional)

Grafana Cloud OTLP on backend/workers: set `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_EXPORTER_OTLP_HEADERS`. See [`OBSERVABILITY.md`](OBSERVABILITY.md). Verify logs for `"msg":"otel.started"` after deploy.
