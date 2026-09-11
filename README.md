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

**Study AI:** chats live in Postgres. Page text is chunked, embedded (`EMBEDDING_MODEL`), and upserted into the vector DB (filtered by `userId`). Each question retrieves those chunks, the LLM is prompted for the user’s **study goal**, and answers include **citations** back to collection pages. If `VECTOR_DB_URL` is unset, retrieval falls back to keyword search over the library in shelf.

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

## Mobile (Capacitor — Android emulator)

Native iOS/Android shell that loads your **running Next.js app** in a WebView (not a static export). Package: [`mobile/`](mobile/). Full notes: [`docs/MOBILE.md`](docs/MOBILE.md).

### Prerequisites

- Node **22** (`nvm use` from repo root)
- **JDK 21** for Android: `brew install --cask temurin@21`
- Android Studio + an AVD (emulator) running
- Backend + frontend already running (sections above)

### One-time setup

```bash
source ~/.zshrc && nvm use
cd mobile
npm install
# Only if native projects are missing:
# npx cap add android && npx cap add ios
```

### Every session — Android emulator (recommended)

**Most reliable:** tunnel host ports into the emulator with `adb reverse`, then load `http://localhost:3000` (same as a browser on your Mac).

**Terminal A — backend** (if not already up):

```bash
cd backend && npm run dev
```

**Terminal B — frontend:**

```bash
source ~/.zshrc && nvm use
npm run dev --prefix frontend
```

**Terminal C — reverse ports + Capacitor:**

```bash
source ~/.zshrc && nvm use
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"

# Emulator must already be running (Android Studio → Device Manager → Play)
adb devices
npm run mobile:adb-reverse   # same as: adb reverse tcp:3000 + tcp:4000

cd mobile
SHELF_MOBILE_URL=http://localhost:3000 npx cap sync android
SHELF_MOBILE_URL=http://localhost:3000 npx cap run android
# or from repo root after reverse: npm run mobile:android
```

Re-run `npm run mobile:adb-reverse` after cold-booting the emulator (reverses reset). If you see **Shelf couldn’t connect**, the tunnel dropped — reverse again, then open the app or tap Try again.

**Fallbacks** if you cannot use `adb reverse`:

```bash
# Emulator loopback to host:
SHELF_MOBILE_URL=http://10.0.2.2:3000 npx cap sync android && SHELF_MOBILE_URL=http://10.0.2.2:3000 npx cap run android

# Or Mac LAN IP (also set SHELF_DEV_ORIGINS=<ip> on the frontend):
LAN=$(ipconfig getifaddr en0)
SHELF_MOBILE_URL=http://$LAN:3000 npx cap sync android && SHELF_MOBILE_URL=http://$LAN:3000 npx cap run android
```

### Login (local seed)

```bash
npm run db:seed --prefix backend
```

- Student: `tour@shelf.local` / `tour-tour-tour`
- Admin: `admin@shelf.local` / `admin123`

Keep `frontend/.env.local` as `NEXT_PUBLIC_API_URL=http://localhost:4000` — the app rewrites `localhost` → the WebView host (`10.0.2.2` or your LAN IP) automatically.

### Other targets

| Target | `SHELF_MOBILE_URL` |
|--------|-------------------|
| Android emulator (**preferred**) | `http://localhost:3000` + `adb reverse tcp:3000 tcp:3000` and `tcp:4000` |
| Android emulator (alias) | `http://10.0.2.2:3000` |
| Android / USB (LAN) | `http://<Mac-LAN-IP>:3000` |
| iOS Simulator | `http://localhost:3000` |
| Physical phone (same Wi‑Fi) | `http://<Mac-LAN-IP>:3000` |
| Prod-like | `https://www.myshelflib.com` |

**iOS Simulator:**

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)   # not required for iOS; Node 22 is
cd mobile
SHELF_MOBILE_URL=http://localhost:3000 npx cap sync ios
npx cap run ios
```

**Physical Android (USB + same Wi‑Fi):** enable USB debugging, then:

```bash
ipconfig getifaddr en0
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
cd mobile
SHELF_MOBILE_URL=http://192.168.1.4:3000 npx cap sync android
SHELF_MOBILE_URL=http://192.168.1.4:3000 npx cap run android
```

**Prod-like shell** (no local Next):

```bash
cd mobile
SHELF_MOBILE_URL=https://www.myshelflib.com npx cap sync
npx cap run android   # or: npx cap run ios
```

### Handy scripts

```bash
cd mobile
npm run sync
npm run android
npm run ios
npm run open:android   # Android Studio
npm run open:ios       # Xcode
```

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Webpage not available` / `ERR_ADDRESS_UNREACHABLE` | Use **adb reverse** + `SHELF_MOBILE_URL=http://localhost:3000` (see above). Confirm `adb devices` shows the emulator. |
| Login: “Cannot reach the server” / API URL | Backend running; with adb reverse also run `adb reverse tcp:4000 tcp:4000` |
| Cleartext / HTTP blocked | App enables cleartext via `AndroidManifest` + `network_security_config.xml` — rebuild after pull |
| `Node >= 22` / Capacitor CLI fails | `nvm use` (Node 22) |
| Gradle / Java errors | `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` |
| Stuck after login on first open | Wait for Next to finish compiling `/my-content` (slow once in dev) |
| **Something went wrong** / `SyntaxError: Unexpected token '{'` | Emulator **System WebView is too old** (e.g. Chrome 91 on API 31). Update **Android System WebView** in Play Store on the emulator, or use an **API 34+** AVD. Next 15 needs a modern Chromium. |
| Need console / network / JS stack | See **Debugging the WebView** below |

### Debugging the WebView (logs + network)

The native shell only hosts a Chromium WebView. JS errors and `fetch` calls live in that WebView — not in Gradle.

**1. Chrome DevTools (best — Console + Network)**

1. Emulator running with Shelf open  
2. On your Mac, open Chrome → `chrome://inspect/#devices`  
3. Under the emulator, click **inspect** next to `http://localhost:3000/...`  
4. Use **Console** (errors/stack) and **Network** (API calls to `:4000`)

Debug builds enable WebView inspection by default. If the device doesn’t appear: `adb devices` must show the emulator, and Chrome must be up to date.

**2. Logcat (quick JS console mirror)**

```bash
# Live Capacitor / Chromium console (errors are tag Capacitor/Console level E)
adb logcat -s Capacitor:V Capacitor/Console:V chromium:E

# Or filter after the fact:
adb logcat -d | rg "Capacitor/Console|SyntaxError|ERR_"
```

**3. Next + API terminals**

- Frontend terminal: compile errors / `GET /my-content`  
- Backend terminal: CORS + `/api/...` status codes  

**4. On-device badge**

The **N · Issues** pill is Next.js dev overlay — tap it when visible for the same error Chrome DevTools shows.

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
