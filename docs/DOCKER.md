# Docker images & deploy (Vercel + Render)

```
GitHub push to main
  ├─ Detect which apps changed (backend / processing-service / ingestion-service / frontend)
  ├─ CI: lint / test / build — changed apps only
  ├─ Docker Hub: push only changed images (main, processor-main, ingest-main)
  ├─ Render deploy hooks → only for images just pushed
  └─ Vercel → frontend only when frontend/ (or .nvmrc) changed
```

## Images (Render only)

Docker Hub **Personal** allows **one private repository**. Both images share `shelf`; the service is the tag.

| Service | Image |
|---------|--------|
| Backend | `vishnubhardwaj8826/shelf:main` |
| Processing service | `vishnubhardwaj8826/shelf:processor-main` |
| Ingestion service | `vishnubhardwaj8826/shelf:ingest-main` |

| Tag | Purpose |
|-----|---------|
| **`main`** / `processor-main` / `ingest-main` | Constant tags for Render |
| `latest` / `processor-latest` / `ingest-latest` | Same pointers |
| `<sha>` / `processor-<sha>` / `ingest-<sha>` | Rollback pins |

Frontend is **not** pushed to Docker Hub — Vercel builds it from the repo.

---

## Frontend on Vercel (API URL injection)

In Vercel project → **Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_URL` | your Render backend URL, e.g. `https://shelf.onrender.com` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | optional |

Vercel injects these at **build time** on every **frontend** deploy. After you change them, trigger a Redeploy.

Root Directory must stay `frontend`. Builds are skipped when that folder (and `.nvmrc`) did not change.

Also set backend `CORS_ORIGIN` to your Vercel URL (e.g. `https://your-app.vercel.app`).

---

## Backend + worker on Render

1. Create 3 services → **Deploy an existing image from a registry**
2. Image URLs:

| Service | Image |
|---------|--------|
| Backend | `docker.io/vishnubhardwaj8826/shelf:main` |
| Processing service | `docker.io/vishnubhardwaj8826/shelf:processor-main` |
| Ingestion service | `docker.io/vishnubhardwaj8826/shelf:ingest-main` |

3. Private registry: add Docker Hub username + access token in Render credentials  
4. Env vars on each service (see below)  
5. Deploy Hooks → GitHub secrets (CI triggers them after image push). **Do not** also enable Render auto-deploy from Git — that would bounce both services on every commit.

| Secret | Value |
|--------|--------|
| `RENDER_DEPLOY_HOOK_BACKEND` | backend deploy hook URL |
| `RENDER_DEPLOY_HOOK_PROCESSOR` | processing-service deploy hook URL |
| `RENDER_DEPLOY_HOOK_INGESTION` | ingestion-service deploy hook URL |

---

## GitHub secrets (for Docker publish)

| Name | Value |
|------|--------|
| `DOCKERHUB_USERNAME` | `vishnubhardwaj8826` |
| `DOCKERHUB_TOKEN` | Docker Hub PAT with **Read, Write, Delete** (not account password) |
| `RENDER_DEPLOY_HOOK_BACKEND` | optional |
| `RENDER_DEPLOY_HOOK_PROCESSOR` | optional |
| `RENDER_DEPLOY_HOOK_INGESTION` | optional |

Keep **one** private Hub repo: `shelf` (Personal-plan limit). Do not create a second repo for the processing service.

CI enforces this automatically:

1. Before push → create/keep `shelf` private
2. After push → verify `is_private=true` or **fail the job**
3. Prune tags → keep **at most 10** (`main`, `latest`, `processor-main`, `processor-latest`, `ingest-main`, `ingest-latest` always kept; oldest SHA tags deleted)

No frontend image is published (Vercel only).

> Creating a second private repo fails on Personal (`No more private repositories available`). Upgrade to Pro only if you want separate repos.
> Tag prune needs a PAT with **Read, Write, Delete**.

---

## Runtime env (Render containers)

### Backend

```
DATABASE_URL=
JWT_SECRET=
INTERNAL_SECRET=
CORS_ORIGIN=https://your-app.vercel.app
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=upsc-content
S3_REGION=auto
LOG_LEVEL=info
PORT=4000
```

### Processing service

```
BACKEND_URL=https://shelf.onrender.com
INTERNAL_SECRET=   # same as backend
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=upsc-content
S3_REGION=auto
POLL_INTERVAL_MS=15000
PORT=4001
```

### Ingestion service

```
BACKEND_URL=https://shelf.onrender.com
INTERNAL_SECRET=   # same as backend
INGEST_WORKER_MODE=sqs
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
INGEST_SQS_POLL_QUEUE_URL=
INGEST_SQS_FETCH_QUEUE_URL=
INGEST_SQS_PROCESS_QUEUE_URL=
INGEST_SQS_PROMOTE_QUEUE_URL=
INGEST_SQS_ARCHIVE_QUEUE_URL=
INGEST_SQS_WAIT_SECONDS=20
INGEST_SQS_VISIBILITY_TIMEOUT=300
PORT=4002
```

Backend also needs `INGEST_SCHEDULER=true` and the same SQS queue URLs if the scheduler enqueues polls from the API container. See [`INGEST.md`](INGEST.md).

---

## Pipeline behavior

On **push to `main`**, only apps whose files (or dependents) changed are rebuilt and redeployed. The other two keep running on the last good deploy.

| Change in | CI checks | Docker + Render | Vercel |
|-----------|-----------|-----------------|--------|
| `backend/**` | backend | backend image + hook | skip |
| `processing-service/**` | processing service | processor image + hook | skip |
| `ingestion-service/**` | ingestion service | ingest image + hook | skip |
| `frontend/**` | frontend | skip | deploy |
| `.nvmrc` | all four | skip (images pin `node:22-alpine`) | deploy |
| workflow / docs / other | skip | skip | skip |

The four packages do not import each other. A backend-only change does **not** bounce the workers or frontend; change both trees in the same commit if an API contract requires it.

PRs only run CI checks for the apps that changed.
