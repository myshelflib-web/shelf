# Shelf mobile (Capacitor)

Native iOS/Android shell that loads the **live Next.js app** in a WebView.

**Full guide:** [root README → Mobile](../README.md#mobile-capacitor--android-emulator) · [`docs/MOBILE.md`](../docs/MOBILE.md).

## Quick — Android emulator (adb reverse)

Backend + frontend must be running on the Mac (`localhost:4000` / `localhost:3000`).

```bash
source ~/.zshrc && nvm use
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"

adb devices
adb reverse tcp:3000 tcp:3000
adb reverse tcp:4000 tcp:4000

cd "$(dirname "$0")"   # mobile/
npm install
SHELF_MOBILE_URL=http://localhost:3000 npx cap sync android
SHELF_MOBILE_URL=http://localhost:3000 npx cap run android
```

## Scripts

```bash
npm run sync
npm run android
npm run ios
npm run open:android
npm run open:ios
```
