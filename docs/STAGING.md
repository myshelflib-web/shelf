# Staging / preview isolation

Previews must **not** share production Postgres or the production R2 bucket. Use a dedicated staging stack.

## Hard rules

| Resource | Production | Staging / previews |
|----------|------------|--------------------|
| Postgres | Neon prod DB | **Separate** Neon project or branch |
| Object storage | R2 bucket e.g. `upsc-docs` | **Separate** R2 bucket e.g. `upsc-docs-staging` |
| Docker images | `shelf:main` (etc.) | `shelf:staging` (etc.) — never overwrite prod tags from a PR |
| API | Prod Render URL | Staging Render URL |
| Vercel `NEXT_PUBLIC_API_URL` | Production env → prod API | Preview env → staging API |

Do **not** point staging `DATABASE_URL` or `S3_BUCKET` at production values.

---

## 1. Neon (separate database)

1. Neon → create a **new project** or **branch** (e.g. `shelf-staging`).
2. Copy its connection string.
3. Migrate once:

```bash
cd backend
DATABASE_URL="postgresql://…staging…" npx prisma migrate deploy
```

4. On **every staging** Render service that talks to Postgres (backend; workers if they use DB), set:

```
DATABASE_URL=postgresql://…staging…
```

---

## 2. Cloudflare R2 (separate bucket)

1. R2 → **Create bucket** → e.g. `upsc-docs-staging` (not `upsc-docs`).
2. Create/reuse an R2 API token with Object Read & Write on **that** bucket (or account).
3. Set bucket CORS for staging FE + Vercel previews (same shape as prod CORS, different origins).
4. On **staging** backend + processor (+ ingestion if it writes objects):

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY=…
S3_SECRET_KEY=…
S3_BUCKET=upsc-docs-staging
S3_REGION=auto
```

Prod services keep `S3_BUCKET=upsc-docs` (or your current prod name).

---

## 3. Render staging services — env checklist

Create image-based services on `:staging` / `:processor-staging` / `:ingest-staging`.

### Backend staging (required differences vs prod)

```
DATABASE_URL=                 # staging Neon ONLY
S3_BUCKET=upsc-docs-staging   # staging bucket ONLY
S3_ENDPOINT=…                 # same account OK
S3_ACCESS_KEY=…
S3_SECRET_KEY=…
S3_REGION=auto
CORS_ORIGIN=https://your-staging-fe.vercel.app
ALLOW_VERCEL_PREVIEW_CORS=true
JWT_SECRET=                   # prefer staging-specific
INTERNAL_SECRET=              # must match staging workers
OTEL_DEPLOYMENT_ENVIRONMENT=staging
```

Optional but recommended if using vectors:

```
VECTOR_DB_COLLECTION=shelf-library-staging
```

### Processor / ingestion staging

```
BACKEND_URL=https://your-staging-api.onrender.com
INTERNAL_SECRET=              # same as staging backend
S3_BUCKET=upsc-docs-staging   # same staging bucket
S3_*                          # same as staging backend
```

Wire Deploy Hooks → GitHub secrets `RENDER_DEPLOY_HOOK_*_STAGING`.

---

## 4. Vercel

| Environment | `NEXT_PUBLIC_API_URL` |
|-------------|------------------------|
| Preview | Staging API URL |
| Production | Prod API URL |

---

## 5. GitHub

| Kind | Name |
|------|------|
| Secret | `RENDER_DEPLOY_HOOK_BACKEND_STAGING` |
| Secret | `RENDER_DEPLOY_HOOK_PROCESSOR_STAGING` |
| Secret | `RENDER_DEPLOY_HOOK_INGESTION_STAGING` |
| Label | `deploy-staging` (manual staging image deploy on PRs with backend changes) |

Prod hooks (`RENDER_DEPLOY_HOOK_BACKEND`, etc.) stay for merge-to-`main`.

---

## How deploys use this

- **FE-only PR** → Vercel Preview only (talks to staging API / staging DB / staging bucket via Preview env).
- **Backend PR** → add label `deploy-staging` to rebuild staging images against this isolated stack.
- **Merge to `main`** → production images + prod DB + prod bucket (unchanged).
