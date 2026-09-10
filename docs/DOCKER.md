# Docker images & deploy (Vercel + Render)

```
PR (frontend only)
  └─ Vercel Preview → staging or prod API (Preview env) — no Docker/staging deploy

PR (backend / processor / ingestion changed)
  ├─ CI checks
  ├─ PR with server changes: automatic staging deploy
  └─ When labeled → :staging* images + staging Render hooks (prod untouched)

Push / merge to main  (unchanged production path)
  ├─ CI checks (changed apps)
  ├─ Docker Hub → main / processor-main / ingest-main (+ sha)
  ├─ Render production deploy hooks
  └─ Production Docker/Render: manual workflow
```

**Production is not gated on staging.** PR server changes update shared staging automatically. Production Docker/Render deploys only when someone runs **Deploy production**.


---

## One-time platform checklist

### 1. Neon staging database

Create a separate Neon project or branch. Do **not** reuse production `DATABASE_URL` on staging Render services. Run `npx prisma migrate deploy` against the staging URL once.

### 2. Render staging services (image deploy) — optional until you want PR previews

| Service | Image |
|---------|--------|
| Backend staging | `docker.io/<user>/shelf:staging` |
| Processor staging | `docker.io/<user>/shelf:processor-staging` |
| Ingestion staging | `docker.io/<user>/shelf:ingest-staging` |

- Same shape of env vars as prod; use staging DB, staging `BACKEND_URL`, `OTEL_DEPLOYMENT_ENVIRONMENT=staging`.
- Staging backend: `ALLOW_VERCEL_PREVIEW_CORS=true` and `CORS_ORIGIN` including your staging FE origin.
- **Leave `ALLOW_VERCEL_PREVIEW_CORS` unset/false on production.**
- Deploy Hooks → GitHub secrets:
  - `RENDER_DEPLOY_HOOK_BACKEND_STAGING`
  - `RENDER_DEPLOY_HOOK_PROCESSOR_STAGING`
  - `RENDER_DEPLOY_HOOK_INGESTION_STAGING`
- Keep existing prod hooks as `RENDER_DEPLOY_HOOK_BACKEND` / `_PROCESSOR` / `_INGESTION` (used by the manual production workflow).
- Do **not** enable Render auto-deploy from Git.

Until staging hooks exist, PR Docker jobs still push `:staging*` tags but skip the hook (no production impact).

### 3. Render production services

Unchanged. Image tags: `:main`, `:processor-main`, `:ingest-main`. Updated on every push to `main` when those apps change.

### 4. Vercel

You must configure **`NEXT_PUBLIC_API_URL` for both environments**:

| Environment | `NEXT_PUBLIC_API_URL` |
|-------------|------------------------|
| **Preview** | Staging Render API URL (when staging exists; else keep prod until then) |
| **Production** | Production Render API URL |

- **Keep automatic Production deployments from Git enabled** — this is the existing FE → prod path.
- Preview deployments stay on for PRs.
- Optional GitHub secrets for CLI tools: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Optional repo variable `STAGING_FRONTEND_ALIAS` for a stable staging FE hostname.

### 5. GitHub variables / secrets

| Name | Purpose |
|------|---------|
| `STAGING_API_URL` | Optional docs / tooling |
| `NEXT_PUBLIC_API_URL` | Prod API (CI build placeholder / keep-awake) |
| `DOCKERHUB_*` | Image push |
| `RENDER_DEPLOY_HOOK_*` | **Prod** hooks (required for main → prod) |
| `RENDER_DEPLOY_HOOK_*_STAGING` | Staging hooks (optional until staging services exist) |
| `VERCEL_*` | Optional CLI deploys |

---

## Images (Render only)

Docker Hub **Personal** allows **one private repository** (`shelf`). Staging and production are **different tags**.

| Event | Backend | Processor | Ingestion |
|-------|---------|-----------|-----------|
| **PR with server changes** | `:staging` | `:processor-staging` | `:ingest-staging` |
| **Push to `main`** (automatic) | `:main` (+ `:latest`, sha) | `:processor-main` | `:ingest-main` |

**Rules:**
- Staging deploy is **manual** (label or Actions → Deploy staging). Frontend-only PRs never need it.
- PR / staging jobs never write `main`, `latest`, `processor-main`, `processor-latest`, `ingest-main`, or `ingest-latest`.
- Production Render services keep pointing at `:main` / `:processor-main` / `:ingest-main`.

Frontend is **not** pushed to Docker Hub — Vercel builds it.

CI prune keeps **at most 20** tags; protected: `main`, `latest`, `processor-main`, `processor-latest`, `ingest-main`, `ingest-latest`, `staging`, `processor-staging`, `ingest-staging`.

---

## Frontend on Vercel (`NEXT_PUBLIC_API_URL`)

| Vercel environment | `NEXT_PUBLIC_API_URL` | Used by |
|--------------------|----------------------|---------|
| **Preview** | Staging API (when ready) | PR preview URLs |
| **Production** | Prod API | Manual **Deploy production** Action |

Root Directory must stay `frontend`. Staging backend may set `ALLOW_VERCEL_PREVIEW_CORS=true`.

---

## Backend + workers on Render

1. **Production** services (existing) → `:main` / `:processor-main` / `:ingest-main`
2. **Staging** services (new, optional) → `:staging` / `:processor-staging` / `:ingest-staging`
3. Never enable Render auto-deploy from Git — CI triggers hooks after image push

**Backend (staging extras):**

```
DATABASE_URL=                 # staging Neon — not prod
CORS_ORIGIN=https://your-staging-fe.vercel.app
ALLOW_VERCEL_PREVIEW_CORS=true
OTEL_DEPLOYMENT_ENVIRONMENT=staging
```

**Backend (production):** exact FE origins only; **no** `ALLOW_VERCEL_PREVIEW_CORS`.

---

## Pipeline behavior

| Event | CI | Docker + Render | Frontend |
|-------|----|-----------------|----------|
| PR frontend-only | FE checks | skip | Vercel Preview |
| PR with server apps | checks + automatic staging deploy | staging tags/hooks | Vercel Preview |
| Push to `main` (changed apps) | checks | skip Docker/Render production deploy | Vercel Production (Git) |
| **Deploy production** (manual) | checks | prod tags + prod hooks (optional redeploy) | `vercel --prod` |
| workflow / docs only | skip | skip | skip |

A backend-only change does **not** bounce workers or frontend; change both trees in the same commit if an API contract requires it.
