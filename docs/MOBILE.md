# Shelf mobile (Capacitor)

Native iOS / Android shell around the **hosted Next.js app**. The WebView loads a live URL — we do **not** static-export Next into the app binary.

Package: [`mobile/`](../mobile/). App id: `com.myshelflib.shelf`.

## Prerequisites

- Node **22** (repo `.nvmrc`)
- **iOS:** macOS + Xcode (+ Simulator). Capacitor 8 uses **Swift Package Manager** (CocoaPods not required)
- **Android:** Android Studio + emulator (or USB phone), and **JDK 21** (Capacitor 8). Temurin: `brew install --cask temurin@21`

App icons are generated from [`frontend/public/icons/shelf-icon-2048.png`](../frontend/public/icons/shelf-icon-2048.png) into Android mipmaps and the iOS AppIcon set. Rebuild the native app after changing icons (`npx cap run android` / `ios`).
- Frontend running (`npm run dev --prefix frontend`) for LAN/dev loads

No Apple Developer or Google Play account is required for Simulator / USB testing.

```bash
cd mobile
npm install
# ios/ and android/ are generated — re-run add only if missing:
# npx cap add ios && npx cap add android
npx cap sync
```

## Server URL modes

Set `SHELF_MOBILE_URL` before `npx cap sync` / `npx cap run` (config is baked at sync time).

| Target | `SHELF_MOBILE_URL` |
|--------|-------------------|
| Android emulator (**preferred**) | `http://localhost:3000` + `adb reverse tcp:3000 tcp:3000` (+ `4000`) |
| Android emulator (alias) | `http://10.0.2.2:3000` |
| Physical phone (same Wi‑Fi) | `http://<your-Mac-LAN-IP>:3000` |
| iOS Simulator | `http://localhost:3000` (default) |
| Prod-like | `https://www.myshelflib.com` |

HTTP (cleartext) is enabled automatically when the URL starts with `http://`.

### Dev CORS / Next bind

- Browser and WebView call the API with `Origin: http://localhost:3000`, `http://10.0.2.2:3000` (Android emulator), or `http://<lan-ip>:3000`. Default API CORS allows localhost + `10.0.2.2`, and **private LAN http origins in local/dev** (disable with `ALLOW_LAN_CORS=false`).
- Keep `NEXT_PUBLIC_API_URL=http://localhost:4000` on the Mac. The WebView rewrites `localhost` → the page host (`10.0.2.2` or your LAN IP) automatically via `getApiUrl()`.
- Next.js blocks non-localhost dev origins by default. `allowedDevOrigins` includes `10.0.2.2`; for a physical phone **or** when the emulator uses your LAN IP, add it: `SHELF_DEV_ORIGINS=192.168.1.4 npm run dev --prefix frontend`.
- Prefer your Mac LAN IP for both emulator and USB phone when `10.0.2.2` shows `ERR_ADDRESS_UNREACHABLE` (common after VPN / emulator network glitches).
- If the remote URL fails entirely, Capacitor shows `www/offline.html` (broken-shelf + contact support) via `server.errorPath` — not Chromium’s “Webpage not available”.
- For physical devices, ensure Next listens on all interfaces if connections fail: `next dev -H 0.0.0.0`.

Prod-like builds use `https://www.myshelflib.com` so existing API / R2 / Google OAuth origins work unchanged.

## How to test

### 1. Browser first (fastest UI loop)

Chrome/Safari device mode, or a phone on Wi‑Fi → `http://<lan-ip>:3000`. Most phone CSS and React work does not need Capacitor.

### 2. iOS Simulator

```bash
# terminal A
npm run dev --prefix frontend

# terminal B
cd mobile
SHELF_MOBILE_URL=http://localhost:3000 npx cap sync ios
npx cap run ios
```

Refresh the WebView after frontend hot-reload when needed. Re-run `cap sync` only when native plugins or `capacitor.config.ts` change.

### 3. Android emulator / USB device

```bash
cd mobile
# Emulator:
SHELF_MOBILE_URL=http://10.0.2.2:3000 npx cap sync android
npx cap run android

# Physical device (replace with your LAN IP):
SHELF_MOBILE_URL=http://192.168.1.10:3000 npx cap sync android
npx cap run android
```

### 4. Prod-like shell

```bash
cd mobile
SHELF_MOBILE_URL=https://www.myshelflib.com npx cap sync
npx cap run ios    # or android
```

Confirm: email + Google login, PDF open/scroll/highlight, upload, Study AI stream, planner, safe areas, keyboard vs composer, Android back button.

## Phone chrome (signed-in)

On phone / Capacitor (`useIsPhone` / `html[data-shelf-phone]`), the signed-in shell uses:

- **Page-title header** — Library / Home / Planner / Study AI (no Shelf logo on every screen) + Search + overflow (⋯)
- **Bottom tabs** — Library, Home, Planner, Study AI, More
- **Library home** — folder explorer is the main screen (not the desktop empty greeting). Open a file for single-doc reading; Study AI is its own tab
- **Touch targets** — explorer row actions stay visible and ≥40px on phone
- **IDs** — `randomId()` polyfills `crypto.randomUUID` for older WebViews

Desktop and tablet layouts are unchanged.

## Debugging (logs, failures, network)

Shelf’s Android/iOS shell is a WebView around Next. Use Chromium DevTools for the real console + network panel.

### Chrome remote inspect (recommended)

1. Start the emulator/app so Shelf is open.
2. On the Mac: Chrome → [chrome://inspect/#devices](chrome://inspect/#devices)
3. Find the WebView / `localhost:3000` (or LAN URL) entry → **inspect**
4. **Console** = JS errors / React stacks; **Network** = API calls (`localhost:4000` via `adb reverse`)

### adb logcat

```bash
adb logcat -s Capacitor:V "Capacitor/Console:V" chromium:E
```

`Capacitor/Console` mirrors `console.*` from the page. Look for `SyntaxError`, `ERR_`, `Failed to fetch`.

### Host terminals

| Where | What you see |
|-------|----------------|
| `npm run dev --prefix frontend` | Compiles, page `GET`s, Next errors |
| `npm run dev` in `backend/` | CORS allow/deny, `/api/*` status |
| `npm run mobile:adb-reverse` | Must list `tcp:3000` and `tcp:4000` |

### Common crash on old emulators

API 31 images often ship **Android System WebView ~91**. Next.js 15 emits JS that WebView cannot parse → `SyntaxError: Unexpected token '{'` on `/my-content` → branded **Something went wrong**.

Fix: update **Android System WebView** (and Chrome) via Play Store on the AVD, or create a newer AVD (**API 34+** Google APIs / Play image).

### Checklist each session

- [ ] Login (email OTP + Google)
- [ ] Open PDF (scroll, zoom, highlight/pen)
- [ ] Upload a file
- [ ] Study AI stream reply
- [ ] Planner agenda on phone
- [ ] Notch / home-indicator safe areas
- [ ] Keyboard does not cover Study AI composer
- [ ] Android hardware back

## Scripts

```bash
cd mobile
npm run sync
npm run ios
npm run android
npm run open:ios
npm run open:android
```

## Frontend bridge

When the page runs inside Capacitor, [`CapacitorProvider`](../frontend/src/components/CapacitorProvider.tsx) syncs status bar to theme, hides the PWA install hint, handles Android back, and exposes haptics helpers.

## Later (store accounts)

When Apple Developer + Play Console exist:

1. Create signing identities / keystores
2. Associated Domains / App Links for `https://www.myshelflib.com`
3. TestFlight + Play internal testing track
4. Privacy questionnaires, screenshots, review notes (explain WebView + native chrome)
5. Point release `SHELF_MOBILE_URL` at production and ship
