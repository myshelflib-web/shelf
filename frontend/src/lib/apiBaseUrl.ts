/**
 * API base URL for browser/WebView fetches.
 *
 * Android emulator loads Next at http://10.0.2.2:3000 — `localhost` in
 * NEXT_PUBLIC_API_URL would point at the emulator itself. When the page host
 * is the emulator alias or a LAN IP, rewrite localhost/127.0.0.1 to that host.
 */
const CONFIGURED_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");

/** Env / SSR default (no window rewrite). Prefer getApiUrl() for client fetches. */
export const API_URL = CONFIGURED_API_URL;

export function getApiUrl(): string {
  if (typeof window === "undefined") return CONFIGURED_API_URL;
  const pageHost = window.location.hostname;
  if (pageHost === "localhost" || pageHost === "127.0.0.1") {
    return CONFIGURED_API_URL;
  }
  try {
    const u = new URL(CONFIGURED_API_URL);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") {
      u.hostname = pageHost;
      return u.origin;
    }
  } catch {
    /* keep configured */
  }
  return CONFIGURED_API_URL;
}
