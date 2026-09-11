import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Shelf Capacitor shell — WebView loads the live Next.js app (not a static export).
 *
 * Modes (set SHELF_MOBILE_URL before `npx cap sync` / `cap run`):
 * - Dev Android emulator (preferred): http://localhost:3000 + `adb reverse tcp:3000 tcp:3000` (+ 4000)
 * - Dev Android emulator (alias): http://10.0.2.2:3000
 * - Dev iOS Simulator:  http://localhost:3000
 * - Dev physical device:  http://<your-lan-ip>:3000  (+ cleartext)
 * - Prod-like:            https://www.myshelflib.com
 *
 * Default when unset: localhost (works with adb reverse / iOS Simulator).
 * See docs/MOBILE.md.
 */
const serverUrl =
  process.env.SHELF_MOBILE_URL?.trim() || "http://localhost:3000";

const isHttp = serverUrl.startsWith("http://");

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const serverHost = hostnameOf(serverUrl);

const config: CapacitorConfig = {
  appId: "com.myshelflib.shelf",
  appName: "Shelf",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: isHttp,
    // Branded fallback when the remote Next URL fails to load (replaces Chromium
    // "Webpage not available" / ERR_ADDRESS_UNREACHABLE).
    errorPath: "offline.html",
    allowNavigation: [
      "localhost",
      "127.0.0.1",
      "10.0.2.2",
      ...(serverHost ? [serverHost] : []),
      "*.myshelflib.com",
      "myshelflib.com",
      "www.myshelflib.com",
      "staging.myshelflib.com",
    ],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 400,
      backgroundColor: "#0c0c0d",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0c0d",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  android: {
    allowMixedContent: isHttp,
  },
};

export default config;
