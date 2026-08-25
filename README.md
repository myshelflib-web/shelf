# Shelf

A personal study library. Upload PDFs, organize collections and pages, highlight as you read, plan revision on the planner, and ask Study AI over your own material.

**For coding agents:** start with [AGENTS.md](AGENTS.md), then the package file (`frontend/AGENTS.md`, `backend/AGENTS.md`, `processing-service/AGENTS.md`).

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Frontend   │────▶│   Backend    │────▶│   PostgreSQL    │
│  (Next.js)  │     │  (Express)   │     │  chats + users  │
└─────────────┘     └──────┬───────┘     └────────┬────────┘
                           │                      │
                    ┌──────▼───────┐     ┌────────▼────────┐
                    │ Processing   │     │  Vector DB      │
                    │ service      │     │  (Qdrant Cloud) │
                    └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────▼───────┐
                    │  S3 / MinIO  │
                    └──────────────┘
```

**Study AI:** chats live in Postgres. Page text is chunked, embedded (`EMBEDDING_MODEL`), and upserted into the vector DB (filtered by `userId`). Each question retrieves those chunks, the LLM is prompted for the user’s **study goal**, and answers include **citations** back to collection pages. If `VECTOR_DB_URL` is unset, retrieval falls back to keyword search over the library.

## Features

- **Library** — Collections, topics, and pages (PDFs, notes, links) at `/my-content`
- **Study AI** — Multi-turn threads at `/study-ai`, retrieval from your collections, goal-tuned prompts, document citations
- **Reader workspace** — Tabs, optional split view, highlights, and page Ask
- **Planner** — Tasks and events on a weekly board for revision planning
- **Processing service** — Upload PDFs; extract text to HTML beside the source file
- **S3 storage** — Raw PDFs and processed HTML (MinIO for local dev)
- **Auth** — Register, login, Google sign-in, JWT sessions
- **Admin** — Optional curriculum catalog, PDF upload, processing stats

## Prerequisites

**Node.js 22** is required. This repo pins it in `.nvmrc`.

If `npm run dev` fails with `Node >= 22 required`:

```bash
# Install nvm if you don't have it: https://github.com/nvm-sh/nvm#installing-and-updating
source ~/.zshrc          # load nvm in your shell (or open a new terminal)
nvm install              # installs Node from .nvmrc (22)
nvm use                  # switch to project Node version
node --version           # should be >= 22
```

Run `nvm use` from the repo root (or `frontend/`) before `npm install` / `npm run dev` in each service.

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts PostgreSQL, MinIO (S3), and **Qdrant** (vector DB on port 6333).

**Optional — local Study AI (Ollama):**

```bash
docker compose --profile ai up -d
docker exec shelf-ollama ollama pull llama3.2:1b
docker exec shelf-ollama ollama pull nomic-embed-text
```

Then in `backend/.env` set `VECTOR_DB_URL=http://localhost:6333`, `LLM_API_KEY=ollama`, `LLM_BASE_URL=http://localhost:11434/v1`, `LLM_MODEL=llama3.2:1b`, `EMBEDDING_MODEL=nomic-embed-text` (see `backend/.env.example`).

**No Docker?** See [docs/DEPLOY.md](docs/DEPLOY.md) for cloud deployment (Vercel + Neon + R2 + Render).

### Upload → process flow

1. Upload a PDF (library or admin catalog) → stored in S3 as `source.pdf` in that page’s folder
2. DB record created with status `PROCESSING`
3. **Processing service** polls every 15s, converts PDF → HTML in the **same folder** (`content.html`)
4. Worker updates DB with `contentUrl` and status `PUBLISHED`

The processing service must be running for uploads to become readable content.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma migrate deploy
npm run dev
```

Backend runs at `http://localhost:4000`

### 3. Processing service

```bash
cd processing-service
cp .env.example .env
npm install
npm run dev
```

The processing service runs at `http://localhost:4001`

### 4. Frontend

```bash
source ~/.zshrc && nvm use   # Node 22 required
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## Google Sign-In Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application)
3. Add authorized JavaScript origins:
   - `http://localhost:3000`
4. Copy the Client ID into:
   - `frontend/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `backend/.env` → `GOOGLE_CLIENT_ID` (same value)

Users can sign in with Google on the login page. If an account already exists with the same email, Google will be linked automatically.

## Admin Dashboard

Log in as admin and go to **http://localhost:3000/admin**

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/admin` | Stats overview, recent uploads, quick actions |
| Upload PDFs | `/admin/upload` | Drag & drop PDF upload by subject/topic |
| Manage Topics | `/admin/topics` | Filter, view, reprocess failed, delete topics |

After first migration, seed creates:
- Email: `admin@shelf.local`
- Password: `admin123`

## Seeded curriculum subjects

- Indian Polity
- Indian History
- Geography
- Economy
- Environment & Ecology
- Science & Technology
- Current Affairs

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Google sign-in (credential token) |
| GET | `/api/subjects` | List subjects with topics |
| GET | `/api/topics/:slug` | Get topic content |
| POST | `/api/admin/upload` | Upload PDF (admin) |
| GET | `/api/highlights/:topicId` | Get user highlights |
| POST | `/api/highlights` | Create highlight |
| DELETE | `/api/highlights/:id` | Delete highlight |
| POST | `/api/progress/:topicId` | Mark topic complete |

## Environment Variables

See `.env.example` in each service directory.

## Production Deployment

Deploy with **Vercel + Neon + Cloudflare R2 + Render** — no credit card required, no CI/CD pipeline needed.

See **[docs/DEPLOY.md](docs/DEPLOY.md)** for the full step-by-step guide.

Push to GitHub → Vercel and Render auto-deploy. Optional: `.github/workflows/ci.yml` runs build checks on pull requests.
